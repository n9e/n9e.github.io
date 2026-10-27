# 用夜莺监控 LDAP（OpenLDAP、389ds）

读取 LDAP 服务器的 cn=Monitor 后端，采集连接、各类操作计数、等待者和线程状态，支持 OpenLDAP 和 389 Directory Server。

最后校对于 2026-10-27

LDAP 插件查询服务器的监控后端（`cn=Monitor`），得到当前与累计连接数、bind、search、modify、add、delete 等操作的计数、等待中的读写、线程池状态和运行时长。支持 OpenLDAP 和 389ds 两种方言，指标名按方言略有不同。

前提是 LDAP 服务器启用了 monitor 后端（OpenLDAP 的 `olcDatabase=monitor`）并允许监控账号读取。支持 StartTLS 和 LDAPS。规则覆盖连接数异常、操作错误升高、bind 失败增多和服务不可达。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **5 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.ldap`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.ldap/ldap.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.ldap started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # # append some labels for series

   # labels = { region="cloud", product="n9e" }



   # # interval = global.interval * interval_times

   # interval_times = 1



   ## Server to monitor

   ## The scheme determines the mode to use for connection with

   ##    ldap://...      -- unencrypted (non-TLS) connection

   ##    ldaps://...     -- TLS connection

   ##    starttls://...  --  StartTLS connection

   ## If no port is given, the default ports, 389 for ldap and starttls and

   ## 636 for ldaps, are used.

   #server = "ldap://localhost"



   ## Server dialect, can be "openldap" or "389ds"

   # dialect = "openldap"



   # DN and password to bind with

   ## If bind_dn is empty an anonymous bind is performed.

   bind_dn = ""

   bind_password = ""



   ## Reverse the field names constructed from the monitoring DN

   # reverse_field_names = false



   ## Optional TLS Config

   # use_tls = false

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = false
   ```

2. 在夜莺「集成中心」里找到 Ldap，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### OpenLDAP 连接数逼近文件描述符上限[​](#openldap-连接数逼近文件描述符上限 "OpenLDAP 连接数逼近文件描述符上限的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
openldap_current_connections / (openldap_max_file_descriptors_connections > 0) * 100 > 80
```

处置步骤:

1. 执行 ldapsearch -x -D \<bind\_dn> -w \<pw> -b 'cn=Connections,cn=Monitor' 查看当前连接明细，定位连接数最多的客户端 IP；
2. 大量连接来自同一应用，说明它没有复用连接或没有关闭连接，推动应用侧改用连接池；
3. 应急可调大 slapd 的 ulimit -n（systemd 下改 LimitNOFILE）并重启；
4. 同步检查 olcIdleTimeout 是否配置，未配置时空闲连接会一直占用描述符。

### OpenLDAP 请求积压[​](#openldap-请求积压 "OpenLDAP 请求积压的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
openldap_pending_threads > 0
```

处置步骤:

1. 执行 ldapsearch -x -D \<bind\_dn> -w \<pw> -b 'cn=Operations,cn=Monitor' 看哪类操作（Search/Bind/Modify）量最大；
2. Search 占大头时检查慢查询：在 slapd.conf 打开 loglevel stats 后从日志里找 SRCH 耗时高的过滤器，给对应属性建索引（olcDbIndex）；
3. 索引补完执行 slapindex 重建（需先停 slapd）；
4. 确认不是索引问题则调大 olcThreads（默认 16），并评估 CPU 核数是否成为瓶颈。

### OpenLDAP 线程池饱和[​](#openldap-线程池饱和 "OpenLDAP 线程池饱和的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
openldap_active_threads / (openldap_max_threads > 0) * 100 > 90
```

处置步骤:

1. 执行 ldapsearch -x -D \<bind\_dn> -w \<pw> -b 'cn=Threads,cn=Monitor' 确认 Active/Max 的实时值；
2. 打开 stats 日志定位慢操作，重点看是否存在无索引的 substring 过滤（如 (cn=*abc*)）导致全库扫描；
3. 给高频过滤属性补 olcDbIndex 并 slapindex 重建，这是最有效的降负载手段；
4. 索引已完备仍饱和的，调大 olcThreads 或增加只读副本（syncrepl consumer）分流查询。

### OpenLDAP 操作完成数落后于发起数[​](#openldap-操作完成数落后于发起数 "OpenLDAP 操作完成数落后于发起数的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
openldap_operations_initiated - openldap_operations_completed > 100
```

处置步骤:

1. 执行 ldapsearch -x -D \<bind\_dn> -w \<pw> -b 'cn=Operations,cn=Monitor' 对比各类操作的 Initiated 与 Completed，定位卡住的操作类型；
2. 卡在 Modify/Add 的检查后端数据库锁与磁盘 IO（iostat -x 1），mdb 后端写放大时容易阻塞；
3. 卡在 Search 的按慢查询思路补索引；
4. 若是复制（syncrepl）拖住主库，检查各 consumer 的连通性与延迟，必要时先摘掉异常 consumer。

### OpenLDAP 近期发生过重启[​](#openldap-近期发生过重启 "OpenLDAP 近期发生过重启的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
openldap_uptime_time < 300
```

处置步骤:

1. 先确认是否是计划内变更；
2. 非计划则执行 journalctl -u slapd --since '-30min' 定位退出原因；
3. 执行 dmesg -T | grep -i 'killed process' 确认是否被 OOM 杀掉，mdb 后端的 olcDbMaxSize 配置过大是常见诱因；
4. 重启后执行 ldapsearch -x -b '' -s base namingContexts 验证服务已正常提供，并确认副本同步已追平。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Ldap 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Ldap）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Ldap%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `ldap` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/ldap)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
