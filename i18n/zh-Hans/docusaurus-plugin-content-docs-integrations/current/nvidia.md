---
title: "用夜莺监控 NVIDIA"
sidebar_label: "NVIDIA"
description: "两条路采 NVIDIA GPU：nvidia-smi 轻量够用，DCGM 指标更全；模板带 GPU 总览、单卡和训练任务视角的仪表盘。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/NVIDIA
toc_max_heading_level: 2
mdx:
  format: md
---

NVIDIA GPU 有两种采集方式。`nvidia_smi` 插件执行本机的 `nvidia-smi` 命令并解析输出，不需要额外安装东西，利用率、显存、温度、功耗、时钟都有；也可以通过 SSH 采远端机器。`dcgm` 插件对接 NVIDIA DCGM，指标更细（SM 活跃度、NVLink、XID 错误等），但需要 Categraf 的 with-cgo-plugin 版本和主机上的 DCGM。

仪表盘分别按两种指标写，GPU 总览、单卡明细和按任务汇总各一张。规则关注显存吃满和温度过高。

## 模板里有什么

- **3 张仪表盘**，共 66 个面板
- **2 条告警规则**，每条附处置步骤
- **38 条指标说明**
- **Categraf 采集配置**：`input.dcgm`、`input.nvidia_smi`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

   `conf/input.dcgm/dcgm.toml`

   ```toml
   [[instances]]
   # 指定使用的指标定义文件, 一般使用 default-counters.csv就够了，也可以尝试用其他两个csv文件
   # path to the file, that contains the DCGM fields to collect
     collectors = "conf/input.dcgm/default-counters.csv"

   # 是否是K8s环境，设置为true会附件Pod的信息
   # Enable kubernetes mapping metrics to kubernetes pods
   # kubernetes=false

   # 指标中是否附加 gpu id 作为一个标签
   # Choose Type of GPU ID to use to map kubernetes resources to pods. Possible values: "uid", "device-name"
   # kubernetes-gpu-id-type = "uid"

   # 是否使用 1.x 的ns
   # Use old 1.x namespace
   # use-old-namespace = false

   # 支持的选项是f g i 
   # f: FlexKey 如果MIG被禁用，则监控所有GPU；如果MIG被启用，则监控所有GPU实例
   # g: MajorKey 监控top-level entities：GPU或NvSwitches或CPU 
   # i: MinorKey 监控sub-level entities: GPU实例/NvLinks/CPU核心 - 如果MIG被禁用，则不能指定该选项
     cpu-devices = "f"

   # 与cpu-devices的选项一样
   # gpu devices
     devices = "f"

   # 与cpu-devices的选项一样
     switch-devices = "f"

   # 使用ConfigMap 
   # ConfigMap <NAMESPACE>:<NAME> for metric data
     configmap-data = "none"

   # 这里就是前置依赖的nvidia-dcgm服务, 如果是本机采集，则使用localhost:5555 ,如果是远程采集，则使用远端IP:5555
   # Connect to remote hostengine at <HOST>:<PORT>
     remote-hostengine-info = "localhost:5555"

   # 允许用户在没有实际GPU硬件的环境中模拟GPU, 仅用于测试
   # Accept GPUs that are fake, for testing purposes only
   # fake-gpus = false

   # 将GPU型号名称中的每个空格替换为破折号，确保标识符连续且无空格。 
   # Replaces every blank space in the GPU model name with a dash, ensuring a continuous, space-free identifier.
   # replace-blanks-in-model-name = false
   ```

   `conf/input.nvidia_smi/nvidia_smi.toml`

   ```toml
   # # collect interval
   # interval = 15

   # exec local command
   # e.g. nvidia_smi_command = "nvidia-smi"
   nvidia_smi_command = ""

   # exec remote command
   # nvidia_smi_command = "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null SSH_USER@SSH_HOST nvidia-smi"

   # Comma-separated list of the query fields.
   # You can find out possible fields by running `nvidia-smi --help-query-gpu`.
   # The value `AUTO` will automatically detect the fields to query.
   query_field_names = "AUTO"
   ```

1. 在夜莺「集成中心」里找到 NVIDIA，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| GPU-Jobs | 27 |
| GPU Overview | 16 |
| Nvidia GPU Metrics by nvidia-smi | 23 |

## 内置告警规则

共 2 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### GPU XID 错误

xid错误码信息: https://docs.nvidia.com/deploy/xid-errors/analyzing-xid-catalog.html

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
DCGM_FI_DEV_XID_ERRORS == 32 or DCGM_FI_DEV_XID_ERRORS == 38 or DCGM_FI_DEV_XID_ERRORS == 48 or DCGM_FI_DEV_XID_ERRORS == 61 or DCGM_FI_DEV_XID_ERRORS == 62 or DCGM_FI_DEV_XID_ERRORS == 63 or DCGM_FI_DEV_XID_ERRORS == 64 or DCGM_FI_DEV_XID_ERRORS == 68 or DCGM_FI_DEV_XID_ERRORS == 74 or DCGM_FI_DEV_XID_ERRORS == 79 or DCGM_FI_DEV_XID_ERRORS == 92 or DCGM_FI_DEV_XID_ERRORS == 94 or DCGM_FI_DEV_XID_ERRORS == 95
```

处置步骤:

1. 用 nvidia-smi -q -d PAGE_RETIREMENT,ECC 与 dmesg -T | grep -i xid 确认具体 XID 码和涉及的卡；
1. 对照 NVIDIA XID 文档判断是软件（驱动/CUDA）还是硬件故障；
1. Xid 48/63/64（ECC）与 79（掉卡）基本可判定硬件问题，先把该卡从调度池摘除（K8s 上给节点打 taint）；
1. 软件类的升级驱动/CUDA 后复测，硬件类的走返修流程。

### GPU 温度过高

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
sum by (Hostname, modelName, gpu) (DCGM_FI_DEV_GPU_TEMP > 85)
```

处置步骤:

1. 用 nvidia-smi -q -d TEMPERATURE,PERFORMANCE 确认当前温度与是否已触发 SW/HW Slowdown；
1. 检查机箱风道、风扇转速与滤网积灰，确认机房进风温度正常；
1. 多卡机型确认是否所有卡都高温——单卡高温多为散热器接触或风扇问题；
1. 短期可用 nvidia-smi -pl 降低功耗上限或降低任务并发，为停机除尘争取时间。

## 指标说明

共 38 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标 | 含义 | 单位 |
| --- | --- | --- |
| `DCGM_FI_DEV_GPU_UTIL` | GPU利用率 — 表示GPU利用率，即在一个周期时间内（1s或1/6s，根据GPU产品而定），一个或多个核函数处于Active的时间。该指标仅能够展示有核函数在用的GPU资源，但无法展示具体的使用情况。 | % |
| `DCGM_FI_DEV_MEM_COPY_UTIL` | 内存带宽利用率 — 表示内存带宽利用率。以英伟达GPU V100为例，其最大内存带宽为900 GB/sec，如果当前的内存带宽为450 GB/sec，则内存带宽利用率为50%。 | % |
| `DCGM_FI_DEV_ENC_UTIL` | 编码器利用率 — 表示编码器利用率。 | % |
| `DCGM_FI_DEV_DEC_UTIL` | 解码器利用率 — 表示解码器利用率。 | % |
| `DCGM_FI_DEV_FB_FREE` | 帧缓存剩余数 — 表示帧缓存（Framebuffer Memory）剩余数。说明：帧缓存一般也被称为显存。 | MiB |
| `DCGM_FI_DEV_FB_USED` | 帧缓存已使用数 — 表示帧缓存已使用数。该值与nvidia-smi命令中Memory-Usage的已使用值对应。 | MiB |
| `DCGM_FI_PROF_GR_ENGINE_ACTIVE` | 图形/计算引擎活跃时间占比 — 表示在一个时间间隔内，Graphics或Compute引擎处于Active的时间占比。该值表示所有Graphics和Compute引擎的平均值。Graphics或Compute引擎处于Active是指Graphics或Compute Context绑定到线程，并且Graphics或Compute Context处于Busy状态。 | % |
| `DCGM_FI_PROF_SM_ACTIVE` | SM活跃时间占比 — 表示在一个时间间隔内，至少一个线程束在一个SM（Streaming Multiprocessor）上处于Active的时间占比。该值表示所有SM的平均值，且该值对每个块的线程数不敏感。线程束处于Active是指一个线程束被调度且分配资源后的状态，可能是在Computing、也可能是非Computing状态（例如等待内存请求）。该值小于0.5表示未高效利用GPU，大于0.8是必要的。假设一个GPU有N个SM：一个核函数在整个时间间隔内使用N个线程块运行在所有的SM上，此时该值为1（100%）。一个核函数在一个时间间隔内运行N/5个线程块，此时该值为0.2。一个核函数使用N个线程块，在一个时间间隔内，仅运行了1/5个周期的时间，此时该值为0.2。 | % |
| `DCGM_FI_PROF_SM_OCCUPANCY` | SM线程束占用率 — 表示在一个时间间隔内，驻留在SM上的线程束与该SM最大可驻留线程束的比例。该值表示一个时间间隔内的所有SM的平均值。占用率越高不代表GPU使用率越高。只有在GPU内存带宽受限的工作负载（DCGM_FI_PROF_DRAM_ACTIVE）情况下，更高的占用率表示更有效的GPU使用率。 | % |
| `DCGM_FI_PROF_PIPE_TENSOR_ACTIVE` | Tensor管道活跃周期占比 — 表示Tensor（HMMA/IMMA） Pipe处于Active状态的周期分数。该值表示一个时间间隔内的平均值，而不是瞬时值。较高的值表示Tensor Cores的利用率较高。该值为1（100%）表示在整个时间间隔内每隔一个指令周期发出一个Tensor指令（两个周期完成一条指令）。假设该值为0.2（20%），可能有如下情况：在整个时间间隔内，有20%的SM的Tensor Core以100%的利用率运行。在整个时间间隔内，有100%的SM的Tensor Core以20%的利用率运行。在整个时间间隔的1/5时间内，有100%的SM上的Tensor Core以100%利用率运行。其他组合模式。 | % |
| `DCGM_FI_PROF_PIPE_FP64_ACTIVE` | FP64管道活跃周期占比 — 表示FP64（双精度）Pipe处于Active状态的周期分数。该值表示一个时间间隔内的平均值，而不是瞬时值。较高的值代表FP64 Cores有较高的利用率。该值为 1（100%）表示在整个时间间隔内上每四个周期（以Volta类型卡为例）执行一次FP64指令。假设该值为0.2（20%），可能有如下情况：在整个时间间隔内，有20%的SM的FP64 Core以100%的利用率运行。在整个时间间隔内，有100%的SM的FP64 Core以20%的利用率运行。在整个时间间隔的1/5时间内，有100%的SM上的FP64 Core以100%利用率运行。其他组合模式。 | % |
| `DCGM_FI_PROF_PIPE_FP32_ACTIVE` | FP32管道活跃周期占比 — 表示乘加操作FMA（Fused Multiply-Add）管道处于Active的周期分数，乘加操作包括FP32（单精度）和整数。该值表示一个时间间隔内的平均值，而不是瞬时值。较高的值代表FP32 Cores有较高的利用率。该值为1（100%）表示在整个时间间隔内上每两个周期（Volta类型卡为例）执行一次FP32指令。假设该值为0.2（20%），可能有如下情况：在整个时间间隔内，有20%的SM的FP32 Core以100%的利用率运行。在整个时间间隔内，有100%的SM的FP32 Core以20%的利用率运行。在整个时间间隔的1/5时间内，有100%的SM上的FP32 Core以100%利用率运行。其他组合模式。 | % |
| `DCGM_FI_PROF_PIPE_FP16_ACTIVE` | FP16管道活跃周期占比 — 表示FP16（半精度）管道处于Active的周期分数。该值表示一个时间间隔内的平均值，而不是瞬时值。较高的值代表FP16 Cores有较高的利用率。该值为 1 (100%) 表示在整个时间间隔内上每两个周期（Volta类型卡为例）执行一次FP16指令。假设该值为0.2（20%），可能有如下情况：在整个时间间隔内，有20%的SM的FP16 Core以100%的利用率运行。在整个时间间隔内，有100%的SM的FP16 Core以20%的利用率运行。在整个时间间隔的1/5时间内，有100%的SM上的FP16 Core以100%利用率运行。其他组合模式。 | % |
| `DCGM_FI_PROF_DRAM_ACTIVE` | DRAM活跃周期占比 — 表示内存带宽利用率（Memory BW Utilization）将数据发送到设备内存或从设备内存接收数据的周期分数。该值表示时间间隔内的平均值，而不是瞬时值。较高的值表示设备内存的利用率较高。该值为1（100%）表示在整个时间间隔内的每个周期执行一条 DRAM 指令（实际上，峰值约为 0.8 (80%) 是可实现的最大值）。假设该值为0.2（20%），表示20%的周期在时间间隔内读取或写入设备内存。 | % |
| `DCGM_FI_PROF_PCIE_TX_BYTES` | PCIe发送数据速率 — 表示通过PCIe总线传输的数据速率，包括协议标头和数据有效负载。该值表示一个时间间隔内的平均值，而不是瞬时值。该速率在时间间隔内平均。例如，在1秒内传输1 GB数据，则无论以恒定速率还是突发传输数据，速率都是1 GB/s。理论上的最大PCIe Gen3带宽为每通道985 MB/s。 | B/s |
| `DCGM_FI_PROF_PCIE_RX_BYTES` | PCIe接收数据速率 — 表示通过PCIe总线接收的数据速率，包括协议标头和数据有效负载。该值表示一个时间间隔内的平均值，而不是瞬时值。该速率在时间间隔内平均。例如，在1秒内传输1 GB数据，则无论以恒定速率还是突发传输数据，速率都是1 GB/s。理论上的最大PCIe Gen3带宽为每通道985 MB/s。 | B/s |
| `DCGM_FI_PROF_NVLINK_RX_BYTES` | NVLink接收数据速率 — 表示通过NVLink传输的数据速率，不包括协议标头。该值表示一个时间间隔内的平均值，而不是瞬时值。该速率在时间间隔内平均。例如，在1秒内传输1 GB数据，则无论以恒定速率还是突发传输数据，速率都是1 GB/s。理论上，最大NVLink Gen2带宽为每个方向每个链路25 GB/s。 | B/s |
| `DCGM_FI_PROF_NVLINK_TX_BYTES` | NVLink发送数据速率 — 表示通过NVLink接收的数据速率，不包括协议标头。该值表示一个时间间隔内的平均值，而不是瞬时值。该速率在时间间隔内平均。例如，在1秒内传输1 GB数据，则无论以恒定速率还是突发传输数据，速率都是1 GB/s。理论上，最大NVLink Gen2带宽为每个方向每个链路25 GB/s。 | B/s |
| `DCGM_FI_DEV_SM_CLOCK` | SM时钟频率 — 表示SM时钟频率。 | MHz |
| `DCGM_FI_DEV_MEM_CLOCK` | 内存时钟频率 — 表示内存时钟频率。 | MHz |
| `DCGM_FI_DEV_APP_SM_CLOCK` | SM应用时钟频率 — 表示SM应用时钟频率。 | MHz |
| `DCGM_FI_DEV_APP_MEM_CLOCK` | 内存应用时钟频率 — 表示内存应用时钟频率。 | MHz |
| `DCGM_FI_DEV_CLOCK_THROTTLE_REASONS` | 时钟降频原因 — 表示时钟慢下来的原因。 | MHz |
| `DCGM_FI_DEV_XID_ERRORS` | XID错误号 — 表示一段时间内，最后发生的XID错误号。 |  |
| `DCGM_FI_DEV_POWER_VIOLATION` | 功率上限违规时长 — 表示因功率上限而导致的违规，该值为违规的时间。 | μs |
| `DCGM_FI_DEV_THERMAL_VIOLATION` | 热限制违规时长 — 表示由于热限制导致的违规，该值为违规的时间。 | μs |
| `DCGM_FI_DEV_SYNC_BOOST_VIOLATION` | 同步提升限制违规时长 — 表示由于同步提升限制而导致的违规，该值为违规的时间。 | μs |
| `DCGM_FI_DEV_BOARD_LIMIT_VIOLATION` | 电路板限制违规时长 — 表示由于电路板限制而导致的违规，该值为违规的时间。 | μs |
| `DCGM_FI_DEV_LOW_UTIL_VIOLATION` | 低利用率限制违规时长 — 表示低利用率限制导致的违规，该值为违规的时间。 | μs |
| `DCGM_FI_DEV_RELIABILITY_VIOLATION` | 电路板可靠性限制违规时长 — 表示电路板可靠性限制导致违规，该值为违规的时间。 | μs |
| `DCGM_FI_DEV_BAR1_USED` | 已使用的BAR1 — 表示已使用的BAR1。 | MB |
| `DCGM_FI_DEV_BAR1_FREE` | 剩余的BAR1 — 表示剩余的BAR1。 | MB |
| `DCGM_FI_DEV_MEMORY_TEMP` | 内存温度 — 表示内存温度。 | °C |
| `DCGM_FI_DEV_GPU_TEMP` | GPU温度 — 表示GPU温度。 | °C |
| `DCGM_FI_DEV_POWER_USAGE` | GPU功率 — 表示功率。 | W |
| `DCGM_FI_DEV_TOTAL_ENERGY_CONSUMPTION` | 总能耗 — 表示从驱动加载开始，已消耗的能量。 | J |
| `DCGM_FI_DEV_RETIRED_SBE` | 单bit错误停用页面数 — 表示由单bit错误而停用的页面。 |  |
| `DCGM_FI_DEV_RETIRED_DBE` | 双bit错误停用页面数 — 表示用双bit错误而停用的页面。 |  |

## 相关链接

- [NVIDIA 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/NVIDIA）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `dcgm` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/dcgm)：完整配置项和指标列表。
- [Categraf `nvidia_smi` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/nvidia_smi)：完整配置项和指标列表。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
