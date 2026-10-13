---
title: "用夜莺监控 Azure Monitor"
sidebar_label: "Azure"
description: "通过 Azure Monitor API 按资源类型拉取指标，用服务主体鉴权，只需 Monitoring Reader 角色。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Azure
toc_max_heading_level: 2
mdx:
  format: md
---

Azure 插件调用 Azure Monitor 的指标 API，按订阅、资源组或资源类型（虚拟机、存储账户、SQL 数据库、应用服务等）拉取指标，配置里可以按资源类型指定要采的指标名和聚合方式。

需要注册一个服务主体，授予 `Monitoring Reader` 角色，把租户 ID、客户端 ID、密钥和订阅 ID 填进配置。Azure API 每小时限 12000 次读取，采集周期和指标数量要控制在这个额度内。

## 模板里有什么

- **Categraf 采集配置**：`input.azure`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.azure/azure.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.azure started` 就说明插件已加载。

   ```toml
   # Gather Azure resources metrics from Azure Monitor API
   # 每2m查询一次azure monitor, 查询时间范围也为2m
   interval = "2m"
   [[instances]]
   # can be found under Overview->Essentials in the Azure portal for your application/service
   subscription_id = ""
   # can be obtained by registering an application under Azure Active Directory
   client_id = ""
   # can be obtained by registering an application under Azure Active Directory.
   # If not specified Default Azure Credentials chain will be attempted:
   # - Environment credentials (AZURE_*)
   # - Workload Identity in Kubernetes cluster
   # - Managed Identity
   # - Azure CLI auth
   # - Developer Azure CLI auth
   client_secret = ""
   # can be found under Azure Active Directory->Properties
   tenant_id = ""
   # Define the optional Azure cloud option e.g. AzureChina, AzureGovernment or AzurePublic. The default is AzurePublic.
   # cloud_option = "AzurePublic"

   # 聚合粒度
   # 比如我采集周期是10m, 指标上报周期是30s, 那么在10m内会有20个原始点
   # 经过该参数的聚合处理后，比如聚合粒度是1m, 那么就会获取到10个点
   # 注意，最小值是1m
   # 支持的值为1m,5m,15m,30m,1h,6h,12h,1d
   # 且aggregation_interval不能大于interval
   aggregation_interval = "1m"

   ## 以下为采集目标配置，有三种方式，分别是指定资源、指定资源组、指定订阅
   ## 三种方法可同时使用
   # 方式一：指定具体的资源, 比如某台具体的主机
   # [[instances.resource_target]]
   # can be found under Overview->Essentials->JSON View in the Azure portal for your application/service
   # must start with 'resourceGroups/...' ('/subscriptions/xxxxxxxx-xxxx-xxxx-xxx-xxxxxxxxxxxx'
   # must be removed from the beginning of Resource ID property value)
   # resource_id = "resourceGroups/flashcat/providers/Microsoft.Compute/virtualMachines/lfn-test"

   # the metric names to collect
   # leave the array empty to use all metrics available to this resource
   # metrics = [ "<<METRIC>>", "<<METRIC>>" ]
   # metrics aggregation type value to collect
   # can be 'Total', 'Count', 'Average', 'Minimum', 'Maximum'
   # leave the array empty to collect all aggregation types values for each metric
   # aggregations = [ "<<AGGREGATION>>", "<<AGGREGATION>>" ]

   # 方式二：指定资源组
   # # resource group target #1 to collect metrics from resources under it with resource type
   # [[instances.resource_group_target]]
   # # the resource group name
   # resource_group = "flashcat"
   #
   # # defines the resources to collect metrics from
   # [[instances.resource_group_target.resource]]
   # # the resource type
   # resource_type = "Microsoft.Compute/virtualMachines"
   # metrics = [ "<<METRIC>>", "<<METRIC>>" ]
   # aggregations = [ "<<AGGREGATION>>", "<<AGGREGATION>>" ]

   # 方式三：指定订阅ID
   # # subscription target #1 to collect metrics from resources under it with resource type
   # [[instances.subscription_target]]
   # resource_type = "<<RESOURCE_TYPE>>"
   # metrics = [ "<<METRIC>>", "<<METRIC>>" ]
   # aggregations = [ "<<AGGREGATION>>", "<<AGGREGATION>>" ]
   ```

## 相关链接

- [Azure 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Azure）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
