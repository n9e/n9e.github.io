# 用夜莺监控 AMD ROCm SMI

调用 rocm-smi 采集 AMD GPU 的利用率、显存、温度、功耗和时钟，规则覆盖过热和显存吃满。

最后校对于 2026-10-28

AMD ROCm SMI 插件从 Telegraf 移植，执行 ROCm 自带的 `rocm-smi` 二进制并解析输出，得到每张 AMD GPU 的使用率、显存占用、温度、功耗、风扇和各级时钟。

主机上要装好 ROCm，默认在 `/opt/rocm/bin/rocm-smi`；路径不同就在配置里改 `bin_path`。规则针对温度过高、显存占满和功耗接近上限。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **4 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.amd_rocm_smi`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.amd_rocm_smi/rocm.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.amd_rocm_smi started` 就说明插件已加载。

   ```
   # Query statistics from AMD Graphics cards using rocm-smi binary

   # bin_path = "/opt/rocm/bin/rocm-smi"



   ## Optional: timeout for GPU polling

   # timeout = "5s"
   ```

2. 在夜莺「集成中心」里找到 AMD ROCm SMI，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 4 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### AMD GPU 显存使用率过高[​](#amd-gpu-显存使用率过高 "AMD GPU 显存使用率过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
amd_rocm_smi_memory_used / (amd_rocm_smi_memory_total > 0) * 100 > 90
```

处置步骤:

1. 从告警标签取 gpu\_id 与 name，执行 rocm-smi --showmemuse --showpids 确认是哪些进程占用显存；
2. 有已退出但显存未释放的僵尸进程时，确认无人使用后 kill 掉释放；
3. 训练任务本身需要这么多显存的，调小 batch size 或启用梯度累积、混合精度；
4. 多任务共用一张卡的，改用显存隔离或排队调度，避免互相挤占导致全部失败。

### AMD GPU 结温过高[​](#amd-gpu-结温过高 "AMD GPU 结温过高的直接链接")

S1 紧急 · 持续 3 分钟 · 触发条件:

```
amd_rocm_smi_temperature_sensor_junction > 95
```

处置步骤:

1. 从告警标签取 gpu\_id，执行 rocm-smi --showtemp --showfan --showpower 确认温度、风扇转速与功耗；
2. 风扇转速偏低的检查风扇是否故障或积灰，必要时停机清理；
3. 风扇已满速仍高温的，检查机箱风道与机房进风温度，确认相邻卡槽是否过密导致散热不良；
4. 短期可用 rocm-smi --setpoweroverdrive 降低功耗上限限制发热，但必须尽快解决散热问题。

### AMD GPU 边缘温度过高[​](#amd-gpu-边缘温度过高 "AMD GPU 边缘温度过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
amd_rocm_smi_temperature_sensor_edge > 85
```

处置步骤:

1. 从告警标签取 gpu\_id，执行 rocm-smi --showtemp --showclocks 对比温度与当前频率，确认是否已经降频；
2. 检查同机上其他 GPU 的温度，普遍偏高说明是机房或机箱级散热问题；
3. 单卡偏高的检查该卡的风扇、散热硅脂与安装位置；
4. 处理散热的同时评估是否需要降低该卡的任务并发，避免长期在降频状态下跑任务。

### AMD GPU 显存温度过高[​](#amd-gpu-显存温度过高 "AMD GPU 显存温度过高的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
amd_rocm_smi_temperature_sensor_memory > 95
```

处置步骤:

1. 从告警标签取 gpu\_id，执行 rocm-smi --showtemp 确认显存温度与结温的差值；
2. 显存温度显著高于结温的，通常是显存侧散热片接触不良，需要停机检查；
3. 检查是否有长期跑大显存带宽的任务（如大模型推理），可通过降低并发缓解；
4. 同时执行 rocm-smi --showretiredpages 检查是否已出现坏页，坏页增长说明显存正在劣化，需安排更换。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[AMD ROCm SMI 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/AMD\_ROCm\_SMI）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/AMD_ROCm_SMI%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `amd_rocm_smi` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/amd_rocm_smi)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
