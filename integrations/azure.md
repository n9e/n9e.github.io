# Monitor Azure Monitor with Nightingale

Pulls metrics per resource type through the Azure Monitor API, authenticating with a service principal that only needs the Monitoring Reader role.

Last reviewed 2026-10-27

The Azure input calls the Azure Monitor metrics API and pulls metrics by subscription, resource group or resource type (virtual machines, storage accounts, SQL databases, App Service and so on). The config lets you name the metrics and aggregations to collect per resource type.

Register a service principal, grant it the `Monitoring Reader` role, and put the tenant ID, client ID, secret and subscription ID into the config. The Azure API allows 12,000 reads per hour, so keep the interval and metric count within that budget.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **Categraf collector config**: `input.azure`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.azure/azure.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.azure started` once the plugin is loaded.

   ```
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

## Related[​](#related "Direct link to Related")

* [Azure template source](https://github.com/ccfos/nightingale/tree/main/integrations/Azure): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
