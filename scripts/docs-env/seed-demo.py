#!/usr/bin/env python3
"""把一个空的夜莺实例灌成「像真的在用」的样子，供文档截图使用。

只用标准库，没有依赖。可重复执行：每一步都先查后建，已存在就跳过。

    python3 scripts/docs-env/seed-demo.py            # 全部
    python3 scripts/docs-env/seed-demo.py teams orgs # 只跑指定步骤

前提：夜莺跑在 --base（默认 http://127.0.0.1:17000），账号 root/root.2020。
截图用的演示数据都带 demo 语义，不要指向任何真实生产系统。
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("N9E_BASE", "http://127.0.0.1:17000")
USER = os.environ.get("N9E_USER", "root")
PASSWORD = os.environ.get("N9E_PASSWORD", "root.2020")

# 除内置时序库以外的数据源都指向一台常驻各类容器的测试机。
# 这个仓库是公开的，所以地址和口令一律从环境变量来，不写死：
#
#   export DS_HOST=<测试机地址>
#   export DS_MYSQL_PASSWORD=... DS_PGSQL_PASSWORD=...
#   export DS_CK_PASSWORD=...    DS_TDENGINE_PASSWORD=...
#
# 不设 DS_HOST 就跳过这些数据源，只保留内置时序库——文档站的大部分截图并不需要它们。
DS_HOST = os.environ.get("DS_HOST", "")
DS_MYSQL_USER = os.environ.get("DS_MYSQL_USER", "root")
DS_MYSQL_PASSWORD = os.environ.get("DS_MYSQL_PASSWORD", "")
DS_PGSQL_USER = os.environ.get("DS_PGSQL_USER", "postgres")
DS_PGSQL_PASSWORD = os.environ.get("DS_PGSQL_PASSWORD", "")
DS_CK_USER = os.environ.get("DS_CK_USER", "default")
DS_CK_PASSWORD = os.environ.get("DS_CK_PASSWORD", "")
DS_TDENGINE_USER = os.environ.get("DS_TDENGINE_USER", "root")
DS_TDENGINE_PASSWORD = os.environ.get("DS_TDENGINE_PASSWORD", "")

_token = None


def api(method, path, body=None, raw=False, lang=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    # 内置模板的名字按 X-Language 返回不同语言（[Center] I18NHeaderKey）
    if lang:
        req.add_header("X-Language", lang)
    if _token:
        req.add_header("Authorization", "Bearer " + _token)
    # 本机地址不要走系统代理，否则会被 127.0.0.1:7890 截走
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(req, timeout=60) as resp:
            text = resp.read().decode()
    except urllib.error.HTTPError as e:
        text = e.read().decode()
    if raw:
        return text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"err": "non-json response", "raw": text[:200]}


def login():
    global _token
    r = api("POST", "/api/n9e/auth/login", {"username": USER, "password": PASSWORD})
    _token = r["dat"]["access_token"]


def items(r):
    """列表接口的 dat 有两种形状：直接是数组，或者 {list, total}。"""
    dat = r.get("dat")
    if isinstance(dat, dict):
        return dat.get("list") or []
    return dat or []


def ok(r):
    """夜莺的响应有两种形状：{err: ""} 和 {error: ""}，都要看。"""
    return not (r.get("err") or r.get("error"))


def say(status, what, detail=""):
    mark = {"new": "+", "skip": "=", "fail": "!"}[status]
    print(f"  {mark} {what}{('  ' + str(detail)[:110]) if detail else ''}")


# --------------------------------------------------------------------------
# 团队与用户
# --------------------------------------------------------------------------

TEAMS = [
    ("trade-dev", "Trading Dev", "Developers on the trading path, on the hook for S1/S2"),
    ("infra-ops", "Infra Ops", "On-call for hosts, network and middleware"),
    ("dba", "DBA", "Database alerts"),
]

USERS = [
    # username, nickname, email, phone, roles
    ("zhaoqi", "Zhao Qi", "zhaoqi@example.com", "13900000001", "Standard"),
    ("qianba", "Qian Ba", "qianba@example.com", "13900000002", "Standard"),
    ("sunjiu", "Sun Jiu", "sunjiu@example.com", "13900000003", "Admin"),
]


def step_teams():
    print("团队")
    existing = {g["name"] for g in items(api("GET", "/api/n9e/user-groups?limit=200&p=1"))}
    for name, label, note in TEAMS:
        if label in existing:
            say("skip", label)
            continue
        r = api("POST", "/api/n9e/user-groups", {"name": label, "note": note})
        say("new" if ok(r) else "fail", label, "" if ok(r) else r)

    print("用户")
    existing = {u["username"] for u in items(api("GET", "/api/n9e/users?limit=200&p=1"))}
    for username, nickname, email, phone, roles in USERS:
        if username in existing:
            say("skip", username)
            continue
        r = api("POST", "/api/n9e/users", {
            "username": username, "nickname": nickname, "password": "Demo.2026",
            "email": email, "phone": phone, "roles": [roles],
        })
        say("new" if ok(r) else "fail", username, "" if ok(r) else r)


# --------------------------------------------------------------------------
# 业务组
# --------------------------------------------------------------------------

BUSI_GROUPS = [
    ("Trading System", ["Trading Dev", "DBA"]),
    ("Infra Platform", ["Infra Ops"]),
]


def _team_ids():
    return {g["name"]: g["id"] for g in items(api("GET", "/api/n9e/user-groups?limit=200&p=1"))}


def step_orgs():
    print("业务组")
    teams = _team_ids()
    existing = {g["name"] for g in items(api("GET", "/api/n9e/busi-groups"))}
    for name, members in BUSI_GROUPS:
        if name in existing:
            say("skip", name)
            continue
        payload = {
            "name": name,
            "members": [{"user_group_id": teams[m], "perm_flag": "rw"} for m in members if m in teams],
        }
        if not payload["members"]:
            say("fail", name, "没找到对应团队，先跑 teams")
            continue
        r = api("POST", "/api/n9e/busi-groups", payload)
        say("new" if ok(r) else "fail", name, "" if ok(r) else r)


# --------------------------------------------------------------------------
# 数据源
# --------------------------------------------------------------------------

def datasources():
    m = DS_HOST
    return [
        {"name": "demo-vm", "plugin_type": "prometheus", "cluster_name": "default",
         "settings": {}, "auth": {"basic_auth": False}, "status": "enabled",
         "http": {"timeout": 10000, "dial_timeout": 10000, "url": f"http://{m}:8428",
                  "max_idle_conns_per_host": 100}},
        {"name": "demo-es", "plugin_type": "elasticsearch", "cluster_name": "default",
         "settings": {"max_shard": 5, "min_interval": 10, "version": "8.19.1"},
         "auth": {"basic_auth": False}, "status": "enabled",
         "http": {"timeout": 10000, "dial_timeout": 10000, "urls": [f"http://{m}:9200"],
                  "max_idle_conns_per_host": 100}},
        {"name": "demo-opensearch", "plugin_type": "opensearch", "cluster_name": "default",
         # opensearch 的 settings 必须用 os. 前缀（datasource/opensearch/opensearch.go），
         # nodes 为空时 upsert 会 200 但什么都不写
         "settings": {"os.nodes": [f"http://{m}:9201"], "os.timeout": 10000,
                      "os.version": "2.19.1", "os.min_interval": 10, "os.max_shard": 5},
         "auth": {"basic_auth": False}, "status": "enabled",
         "http": {"timeout": 10000, "dial_timeout": 10000, "urls": [f"http://{m}:9201"],
                  "max_idle_conns_per_host": 100}},
        {"name": "demo-victorialogs", "plugin_type": "victorialogs", "cluster_name": "default",
         "settings": {"victorialogs.addr": f"http://{m}:9428"},
         "auth": {"basic_auth": False}, "status": "enabled",
         "http": {"timeout": 10000, "dial_timeout": 10000, "url": f"http://{m}:9428",
                  "max_idle_conns_per_host": 100}},
        # Loki 的 URL 必须带 /loki 后缀，否则保存时直接被挡下来
        {"name": "demo-loki", "plugin_type": "loki", "cluster_name": "default",
         "settings": {}, "auth": {"basic_auth": False}, "status": "enabled",
         "http": {"timeout": 10000, "dial_timeout": 10000, "url": f"http://{m}:3100/loki",
                  "max_idle_conns_per_host": 100}},
        {"name": "demo-mysql", "plugin_type": "mysql", "cluster_name": "default",
         "settings": {"mysql.shards": [{"mysql.addr": f"{m}:3306", "mysql.db": "mysql",
                                        "mysql.user": DS_MYSQL_USER, "mysql.password": DS_MYSQL_PASSWORD,
                                        "mysql.timeout": 10000}]},
         "auth": {"basic_auth": False}, "status": "enabled",
         "http": {"timeout": 10000, "dial_timeout": 10000, "max_idle_conns_per_host": 100}},
        {"name": "demo-postgres", "plugin_type": "pgsql", "cluster_name": "default",
         "settings": {"pgsql.shards": [{"pgsql.addr": f"{m}:5433", "pgsql.db": "testdb",
                                        "pgsql.user": DS_PGSQL_USER, "pgsql.password": DS_PGSQL_PASSWORD,
                                        "pgsql.timeout": 10000}]},
         "auth": {"basic_auth": False}, "status": "enabled",
         "http": {"timeout": 10000, "dial_timeout": 10000, "max_idle_conns_per_host": 100}},
        # ClickHouse 的 settings 走 ck.nodes 数组（dskit/clickhouse/clickhouse.go:29），
        # 不是 ck.shards —— datasource/ck 里那个 CKShard 结构体已经不被使用了
        {"name": "demo-clickhouse", "plugin_type": "ck", "cluster_name": "default",
         "settings": {"ck.nodes": [f"{m}:9001"], "ck.user": DS_CK_USER,
                      "ck.password": DS_CK_PASSWORD, "ck.protocol": "native",
                      "ck.timeout": 10000},
         "auth": {"basic_auth": False}, "status": "enabled",
         "http": {"timeout": 10000, "dial_timeout": 10000, "max_idle_conns_per_host": 100}},
        {"name": "demo-tdengine", "plugin_type": "tdengine", "cluster_name": "default",
         "settings": {}, "status": "enabled",
         "auth": {"basic_auth": True, "basic_auth_user": DS_TDENGINE_USER,
                  "basic_auth_password": DS_TDENGINE_PASSWORD},
         "http": {"timeout": 10000, "dial_timeout": 10000, "url": f"http://{m}:6041",
                  "max_idle_conns_per_host": 100}},
    ]


def step_datasources():
    print("数据源")
    if not DS_HOST:
        say("skip", "外部数据源", "没设 DS_HOST，只保留自动注册的内置时序库")
        return
    existing = {d["name"] for d in api("POST", "/api/n9e/datasource/list", {}).get("data", [])
                if d.get("status") != "deleted"}
    for ds in datasources():
        if ds["name"] in existing:
            say("skip", ds["name"])
            continue
        r = api("POST", "/api/n9e/datasource/upsert", ds)
        say("new" if ok(r) else "fail", ds["name"], "" if ok(r) else r)


# --------------------------------------------------------------------------
# 主机归属
# --------------------------------------------------------------------------

# 主机 -> (业务组, 备注)
TARGET_PLACEMENT = {
    "n9e-web-01": ("Trading System", "Order entry, Nginx + app"),
    "n9e-web-02": ("Trading System", "Order entry, Nginx + app"),
    "n9e-db-01": ("Trading System", "Order database primary"),
    "n9e-cache-01": ("Infra Platform", "Shared Redis cluster node"),
    "n9e-build-01": ("Infra Platform", "CI build host, not production"),
}


def _busi_ids():
    return {g["name"]: g["id"] for g in items(api("GET", "/api/n9e/busi-groups"))}


def step_targets():
    print("主机归属")
    bgs = _busi_ids()
    known = {t["ident"]: t for t in items(api("GET", "/api/n9e/targets?limit=500&p=1"))}
    for ident, (bg, note) in TARGET_PLACEMENT.items():
        if ident not in known:
            say("fail", ident, "还没上报，先起 categraf")
            continue
        if known[ident].get("group_ids"):
            say("skip", ident)
            continue
        r = api("PUT", "/api/n9e/targets/bgids",
                {"idents": [ident], "bgids": [bgs[bg]], "action": "reset"})
        api("PUT", "/api/n9e/targets/note", {"idents": [ident], "note": note})
        say("new" if ok(r) else "fail", f"{ident} -> {bg}", "" if ok(r) else r)


# --------------------------------------------------------------------------
# 仪表盘：直接用产品自带的集成模板，比手写 JSON 又快又真实
# --------------------------------------------------------------------------

# 组件 ident -> 要导入的模板名前缀 -> 落到哪个业务组
# 用英文名导入：大盘名是数据，一份要同时出现在中英两套截图里。
# 内置模板的名字随 X-Language 变，这里统一取 en_US 那一版。
DASHBOARDS = [
    ("Linux", "Host Table NG", "Trading System"),
    ("Linux", "Machine Inventory Table View (Categraf as collector)", "Trading System"),
    ("Linux", "Common Machine Metrics (NodeExporter as collector)", "Infra Platform"),
    ("Linux", "Machine Process Count (Categraf as collector)", "Infra Platform"),
]


def _component_id(ident):
    for c in items(api("GET", f"/api/n9e/builtin-components?query={ident}&limit=20")):
        if c["ident"] == ident:
            return c["id"]
    return None


def step_dashboards():
    print("仪表盘")
    bgs = _busi_ids()
    for comp, name, bg in DASHBOARDS:
        cid = _component_id(comp)
        if not cid:
            say("fail", name, f"没有 {comp} 组件")
            continue
        payloads = items(api("GET", f"/api/n9e/builtin-payloads?type=dashboard&component_id={cid}", lang="en_US"))
        hit = next((p for p in payloads if p["name"] == name), None)
        if not hit:
            say("fail", name, "模板里没有这个大盘")
            continue
        gid = bgs[bg]
        exists = {b["name"] for b in items(api("GET", f"/api/n9e/busi-group/{gid}/boards"))}
        if name in exists:
            say("skip", f"{name} @ {bg}")
            continue
        r = api("POST", f"/api/n9e/busi-group/{gid}/boards",
                {"name": name, "tags": comp.lower(), "configs": hit["content"]})
        say("new" if ok(r) else "fail", f"{name} @ {bg}", "" if ok(r) else r)


# --------------------------------------------------------------------------
# 告警规则
# --------------------------------------------------------------------------

def _embedded_ds_id():
    for d in api("POST", "/api/n9e/datasource/list", {}).get("data", []):
        if d["name"] == "embedded-tsdb":
            return d["id"]
    return 1


def demo_rules(ds_id):
    """三条规则，覆盖三种截图需要的状态：现在就会触发的、阈值很高安静的、以及失联检测。

    注意 v6 之后查询写在 rule_config.queries 里，顶层 prom_ql 留空；
    enable_days_of_week / enable_stime 是标量而不是数组（数组是 enable_*s 那组字段）。
    """
    common = {
        "cate": "prometheus",
        # datasource_queries 才是 v9 生效的字段，datasource_ids 会被忽略。
        # match_type 0 = 按数据源 ID 匹配（models/alert_rule.go:341）；
        # 不写的话默认是 {"match_type":2,"values":[0]}，也就是"所有数据源"——
        # 那会让规则跑到局域网那台 VictoriaMetrics 上，把别人的真实主机名扫进演示事件里。
        "datasource_queries": [{"match_type": 0, "op": "in", "values": [ds_id]}],
        "prod": "metric",
        "enable_days_of_week": ["1", "2", "3", "4", "5", "6", "0"],
        "enable_stime": "00:00",
        "enable_etime": "23:59",
        "enable_in_bg": 0,
        "notify_recovered": 1,
        "notify_repeat_step": 60,
        "recover_duration": 0,
        "disabled": 0,
        "prom_ql": "",
    }
    return [
        dict(common, name="Host memory usage too high", note="Memory usage stays above 60% for one minute",
             severity=2, prom_eval_interval=15, prom_for_duration=60,
             append_tags=["service=host", "team=infra"],
             annotations={"summary": "{{$labels.ident}} memory at {{$value | printf \"%.1f\"}}%"},
             rule_config={"inhibit": False, "queries": [
                 {"prom_ql": "mem_used_percent > 60", "severity": 2}]}),
        dict(common, name="Root filesystem almost full", note="Root partition usage above 85% (S2) / 95% (S1)",
             severity=1, prom_eval_interval=60, prom_for_duration=180,
             append_tags=["service=host", "team=infra"],
             annotations={"summary": "{{$labels.ident}} root partition {{$value | printf \"%.1f\"}}% used"},
             rule_config={"inhibit": True, "queries": [
                 {"prom_ql": 'disk_used_percent{path="/"} > 85', "severity": 2},
                 {"prom_ql": 'disk_used_percent{path="/"} > 95', "severity": 1}]}),
        dict(common, name="Collector offline", note="No Categraf heartbeat for two minutes",
             severity=1, prom_eval_interval=30, prom_for_duration=120,
             append_tags=["service=host", "team=infra"],
             annotations={"summary": "{{$labels.ident}} has not sent a heartbeat for two minutes"},
             rule_config={"inhibit": False, "queries": [
                 {"prom_ql": "target_up == 0", "severity": 1}]}),
    ]


def step_rules():
    print("告警规则")
    bgs = _busi_ids()
    gid = bgs["Trading System"]
    ds_id = _embedded_ds_id()
    exists = {r["name"] for r in items(api("GET", f"/api/n9e/busi-group/{gid}/alert-rules"))}
    todo = [r for r in demo_rules(ds_id) if r["name"] not in exists]
    for r in demo_rules(ds_id):
        if r["name"] in exists:
            say("skip", r["name"])
    if not todo:
        return
    resp = api("POST", f"/api/n9e/busi-group/{gid}/alert-rules/import", todo)
    for r in todo:
        say("new" if ok(resp) else "fail", r["name"], "" if ok(resp) else resp)


# --------------------------------------------------------------------------
# 通知：媒介 + 模板 + 通知规则，并把演示规则挂上去
# --------------------------------------------------------------------------

WEBHOOK_URL = os.environ.get("DEMO_WEBHOOK", "http://127.0.0.1:18899/hook")

CHANNEL = {
    "name": "Demo Webhook",
    "ident": "demo-webhook",
    "description": "POSTs every alert to a local endpoint, to show the delivery chain works",
    "enable": True,
    "request_type": "http",
    "param_config": {"user_info": None, "custom": {"params": []}},
    "request_config": {"http_request_config": {
        "url": WEBHOOK_URL,
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "timeout": 10000,
        "concurrency": 5,
        "retry_times": 3,
        "retry_interval": 100,
        "request": {"parameters": {}, "form": "",
                    "body": '{"title": "{{$tpl.title}}", "content": "{{$tpl.content}}"}'},
    }},
}

TEMPLATE = {
    "name": "Demo Webhook template",
    "ident": "demo-webhook",
    "notify_channel_ident": "demo-webhook",
    "private": 0,
    # 事件字段挂在 $event 上，不是模板顶层的 . —— 写成 {{.RuleName}} 会静默渲染成空，
    # {{timeformat .TriggerTime}} 则直接报 "invalid value; expected int64"。
    # 可用字段见内置的 dingtalk 模板，那是最靠谱的抄写对象。
    "content": {
        "title": "{{if $event.IsRecovered}}Recovered{{else}}Triggered{{end}}: {{$event.RuleName}}",
        "content": (
            "Severity: S{{$event.Severity}}\n"
            "Target: {{$event.TargetIdent}}\n"
            "Business group: {{$event.GroupName}}\n"
            "Trigger value: {{$event.TriggerValue}}\n"
            "Trigger time: {{timeformat $event.TriggerTime}}\n"
            "{{$event.AnnotationsJSON.summary}}"
        ),
    },
}

NOTIFY_RULE = {
    "name": "Demo: send everything to webhook",
    "description": "Demo only. In production, route by severity and labels to different media.",
    "enable": True,
    "user_group_ids": [],
    "pipeline_configs": [],
}


def step_notify():
    print("通知媒介")
    channels = {c["ident"]: c["id"] for c in items(api("GET", "/api/n9e/notify-channel-configs"))}
    if CHANNEL["ident"] in channels:
        say("skip", CHANNEL["name"])
        ch_id = channels[CHANNEL["ident"]]
    else:
        r = api("POST", "/api/n9e/notify-channel-configs", [CHANNEL])
        say("new" if ok(r) else "fail", CHANNEL["name"], "" if ok(r) else r)
        channels = {c["ident"]: c["id"] for c in items(api("GET", "/api/n9e/notify-channel-configs"))}
        ch_id = channels.get(CHANNEL["ident"])

    print("消息模板")
    # 新建模板时服务端会自己生成 uuid 当 ident，请求里写的 ident 不作数，
    # 所以只能按 name + 媒介来判重
    tpls = {(t["name"], t["notify_channel_ident"]): t["id"]
            for t in items(api("GET", "/api/n9e/message-templates"))}
    key = (TEMPLATE["name"], TEMPLATE["notify_channel_ident"])
    if key in tpls:
        # 模板已存在也要 PUT 一次：内容改了要能同步过去，
        # 而删除会被"used by notify rule"挡住
        tpl_id = tpls[key]
        # ident 由服务端生成且不允许改，PUT 时必须回传库里那一份
        cur = api("GET", f"/api/n9e/message-template/{tpl_id}").get("dat") or {}
        body = dict(TEMPLATE, id=tpl_id, ident=cur.get("ident", ""))
        r = api("PUT", f"/api/n9e/message-template/{tpl_id}", body)
        say("skip" if ok(r) else "fail", TEMPLATE["name"] + "（已更新内容）", "" if ok(r) else r)
    else:
        r = api("POST", "/api/n9e/message-templates", [TEMPLATE])
        say("new" if ok(r) else "fail", TEMPLATE["name"], "" if ok(r) else r)
        tpls = {(t["name"], t["notify_channel_ident"]): t["id"]
                for t in items(api("GET", "/api/n9e/message-templates"))}
        tpl_id = tpls.get(key)

    print("通知规则")
    if not (ch_id and tpl_id):
        say("fail", NOTIFY_RULE["name"], "媒介或模板没建成，跳过")
        return
    rules = {r["name"]: r["id"] for r in items(api("GET", "/api/n9e/notify-rules"))}
    if NOTIFY_RULE["name"] in rules:
        say("skip", NOTIFY_RULE["name"])
        nr_id = rules[NOTIFY_RULE["name"]]
    else:
        body = dict(NOTIFY_RULE, notify_configs=[{
            "channel_id": ch_id, "template_id": tpl_id, "params": {},
            "severities": [1, 2, 3], "time_ranges": [], "label_keys": [], "attributes": [],
        }])
        r = api("POST", "/api/n9e/notify-rules", [body])
        say("new" if ok(r) else "fail", NOTIFY_RULE["name"], "" if ok(r) else r)
        rules = {r["name"]: r["id"] for r in items(api("GET", "/api/n9e/notify-rules"))}
        nr_id = rules.get(NOTIFY_RULE["name"])

    # 把演示告警规则挂到这条通知规则上，否则事件烧出来也没人收
    if not nr_id:
        return
    bgs = _busi_ids()
    gid = bgs["Trading System"]
    for rule in items(api("GET", f"/api/n9e/busi-group/{gid}/alert-rules")):
        if nr_id in (rule.get("notify_rule_ids") or []):
            say("skip", f"{rule['name']} 已绑定")
            continue
        body = dict(rule, notify_rule_ids=[nr_id])
        r = api("PUT", f"/api/n9e/busi-group/{gid}/alert-rule/{rule['id']}", body)
        say("new" if ok(r) else "fail", f"{rule['name']} 绑定通知规则", "" if ok(r) else r)


# --------------------------------------------------------------------------
# 工作流（事件 Pipeline）
# --------------------------------------------------------------------------

PIPELINE = {
    "name": "Tag production events with the owning team",
    "typ": "user-defined",
    "use_case": "event_pipeline",
    "trigger_mode": "event",
    "disabled": False,
    "group_id": 0,
    "description": "Demo workflow: adds an owner label to events coming from production hosts",
    "filter_enable": True,
    "label_filters": [{"key": "env", "func": "==", "value": "prod"}],
    "attribute_filters": [],
    "processors": [
        {"typ": "relabel", "config": {"relabel_configs": [
            {"action": "replace", "target_label": "owner", "replacement": "trading-oncall"}
        ]}},
    ],
}


def step_pipeline():
    """建一条工作流并挂到通知规则上。

    不挂的话事件不会经过它，「工作流 → 执行记录」页面永远是空的，截出来的图没内容。
    """
    print("工作流")
    existing = {p["name"]: p["id"] for p in items(api("GET", "/api/n9e/event-pipelines"))}
    if PIPELINE["name"] in existing:
        say("skip", PIPELINE["name"])
        pid = existing[PIPELINE["name"]]
    else:
        teams = _team_ids()
        # team_ids 不能为空，接口会直接拒
        body = dict(PIPELINE, team_ids=[teams["Infra Ops"]] if "Infra Ops" in teams else [])
        r = api("POST", "/api/n9e/event-pipeline", body)
        say("new" if ok(r) else "fail", PIPELINE["name"], "" if ok(r) else r)
        existing = {p["name"]: p["id"] for p in items(api("GET", "/api/n9e/event-pipelines"))}
        pid = existing.get(PIPELINE["name"])

    if not pid:
        return
    rules = {r["name"]: r["id"] for r in items(api("GET", "/api/n9e/notify-rules"))}
    nr_id = rules.get(NOTIFY_RULE["name"])
    if not nr_id:
        say("fail", "挂到通知规则", "通知规则还没建，先跑 notify")
        return
    cur = api("GET", f"/api/n9e/notify-rule/{nr_id}").get("dat") or {}
    if any(c.get("pipeline_id") == pid for c in (cur.get("pipeline_configs") or [])):
        say("skip", "已挂在通知规则上")
        return
    cur["pipeline_configs"] = [{"pipeline_id": pid, "enable": True}]
    r = api("PUT", f"/api/n9e/notify-rule/{nr_id}", cur)
    say("new" if ok(r) else "fail", "挂到通知规则上", "" if ok(r) else r)


STEPS = {
    "teams": step_teams,
    "orgs": step_orgs,
    "datasources": step_datasources,
    "targets": step_targets,
    "dashboards": step_dashboards,
    "rules": step_rules,
    "notify": step_notify,
    "pipeline": step_pipeline,
}


def main():
    global BASE
    ap = argparse.ArgumentParser()
    ap.add_argument("steps", nargs="*", help="要执行的步骤；不给就全跑：" + " ".join(STEPS))
    ap.add_argument("--base", default=BASE)
    args = ap.parse_args()

    BASE = args.base
    login()

    for name in (args.steps or list(STEPS)):
        if name not in STEPS:
            print(f"未知步骤：{name}", file=sys.stderr)
            return 1
        STEPS[name]()
    return 0


if __name__ == "__main__":
    sys.exit(main())
