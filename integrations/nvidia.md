# Monitor NVIDIA with Nightingale

Two ways to collect NVIDIA GPUs: nvidia-smi is light and usually enough, DCGM gives more; dashboards cover a fleet overview, single cards and training jobs.

Last reviewed 2026-10-27

There are two collection paths for NVIDIA GPUs. The `nvidia_smi` input runs the local `nvidia-smi` command and parses its output, so nothing else needs installing; utilization, memory, temperature, power and clocks are all there, and remote hosts can be reached over SSH. The `dcgm` input talks to NVIDIA DCGM for finer metrics such as SM activity, NVLink traffic and XID errors, but needs the with-cgo-plugin build of Categraf and DCGM on the host.

The dashboards are written for each metric family: a fleet overview, per-card detail and a per-job view. The rules watch for full memory and high temperature.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **3 dashboards**, 66 panels in total
* **2 alert rules**, each with runbook steps
* **38 metric descriptions**
* **Categraf collector config**: `input.dcgm`, `input.nvidia_smi`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

   `conf/input.dcgm/dcgm.toml`

   ```
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

   ```
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

2. Open the integration center in Nightingale, find NVIDIA, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                        | Panels |
| -------------------------------- | ------ |
| GPU-Jobs                         | 27     |
| GPU Overview                     | 16     |
| Nvidia GPU Metrics by nvidia-smi | 23     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

2 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### GPU XID error[​](#gpu-xid-error "Direct link to GPU XID error")

XID error code reference: <https://docs.nvidia.com/deploy/xid-errors/analyzing-xid-catalog.html>

S2 Warning · for 3 min · Trigger:

```
DCGM_FI_DEV_XID_ERRORS == 32 or DCGM_FI_DEV_XID_ERRORS == 38 or DCGM_FI_DEV_XID_ERRORS == 48 or DCGM_FI_DEV_XID_ERRORS == 61 or DCGM_FI_DEV_XID_ERRORS == 62 or DCGM_FI_DEV_XID_ERRORS == 63 or DCGM_FI_DEV_XID_ERRORS == 64 or DCGM_FI_DEV_XID_ERRORS == 68 or DCGM_FI_DEV_XID_ERRORS == 74 or DCGM_FI_DEV_XID_ERRORS == 79 or DCGM_FI_DEV_XID_ERRORS == 92 or DCGM_FI_DEV_XID_ERRORS == 94 or DCGM_FI_DEV_XID_ERRORS == 95
```

Runbook:

1. Run nvidia-smi -q -d PAGE\_RETIREMENT,ECC and dmesg -T | grep -i xid to identify the exact XID code and the affected card;
2. Compare against the NVIDIA XID documentation to tell a software (driver/CUDA) problem from a hardware fault;
3. Xid 48/63/64 (ECC) and 79 (fallen off the bus) are effectively hardware faults — remove that card from the scheduling pool first (taint the node on Kubernetes);
4. For software issues upgrade the driver/CUDA and retest; for hardware, start the RMA process.

### GPU temperature too high[​](#gpu-temperature-too-high "Direct link to GPU temperature too high")

S2 Warning · for 3 min · Trigger:

```
sum by (Hostname, modelName, gpu) (DCGM_FI_DEV_GPU_TEMP > 85)
```

Runbook:

1. Run nvidia-smi -q -d TEMPERATURE,PERFORMANCE to check the current temperature and whether SW/HW Slowdown has already triggered;
2. Check chassis airflow, fan speeds and dust in the filters, and confirm the room intake temperature is normal;
3. On multi-GPU machines check whether every card is hot — a single hot card usually means a heatsink contact or fan problem;
4. Short term, use nvidia-smi -pl to lower the power cap or reduce job concurrency to buy time for a dust-clean.

## Metric reference[​](#metric-reference "Direct link to Metric reference")

38 metrics, the ones the dashboards and rules above are built on.

| Metric                                 | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Unit |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `DCGM_FI_DEV_GPU_UTIL`                 | GPU Utilization — Indicates GPU utilization, which refers to the time that one or more kernel functions are in the Active state within a cycle (1s or 1/6s, depending on the GPU product). This metric can only show the GPU resources used by kernel functions, but cannot display the specific usage details.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | %    |
| `DCGM_FI_DEV_MEM_COPY_UTIL`            | Memory Bandwidth Utilization — Indicates memory bandwidth utilization. For example, the maximum memory bandwidth of NVIDIA GPU V100 is 900 GB/sec; if the current memory bandwidth is 450 GB/sec, the memory bandwidth utilization is 50%.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | %    |
| `DCGM_FI_DEV_ENC_UTIL`                 | Encoder Utilization — Indicates encoder utilization.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | %    |
| `DCGM_FI_DEV_DEC_UTIL`                 | Decoder Utilization — Indicates decoder utilization.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | %    |
| `DCGM_FI_DEV_FB_FREE`                  | Free Framebuffer Memory — Indicates the free amount of Framebuffer Memory. Note: Framebuffer Memory is generally also referred to as video memory.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | MiB  |
| `DCGM_FI_DEV_FB_USED`                  | Used Framebuffer Memory — Indicates the used amount of Framebuffer Memory. This value corresponds to the used value of Memory-Usage in the nvidia-smi command.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | MiB  |
| `DCGM_FI_PROF_GR_ENGINE_ACTIVE`        | Graphics/Compute Engine Active Time Ratio — Indicates the proportion of time that the Graphics or Compute engine is in the Active state within a time interval. This value represents the average of all Graphics and Compute engines. A Graphics or Compute engine is in the Active state when the Graphics or Compute Context is bound to a thread and the Graphics or Compute Context is in the Busy state.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | %    |
| `DCGM_FI_PROF_SM_ACTIVE`               | SM Active Time Ratio — Indicates the proportion of time that at least one warp is in the Active state on a Streaming Multiprocessor (SM) within a time interval. This value represents the average of all SMs and is not sensitive to the number of threads per block. A warp is in the Active state when it is scheduled and allocated resources, which may be in the Computing state or non-Computing state (e.g., waiting for a memory request). A value less than 0.5 indicates inefficient GPU utilization, and a value greater than 0.8 is necessary. Assume a GPU has N SMs: if a kernel function runs N thread blocks on all SMs for the entire time interval, the value is 1 (100%). If a kernel function runs N/5 thread blocks within a time interval, the value is 0.2. If a kernel function uses N thread blocks but only runs for 1/5 of the cycle within a time interval, the value is 0.2. | %    |
| `DCGM_FI_PROF_SM_OCCUPANCY`            | SM Warp Occupancy — Indicates the ratio of warps resident on an SM to the maximum number of warps that can reside on the SM within a time interval. This value represents the average of all SMs over a time interval. A higher occupancy does not mean a higher GPU utilization rate. Only in the case of workloads limited by GPU memory bandwidth (DCGM\_FI\_PROF\_DRAM\_ACTIVE), a higher occupancy indicates a more effective GPU utilization rate.                                                                                                                                                                                                                                                                                                                                                                                                                                                   | %    |
| `DCGM_FI_PROF_PIPE_TENSOR_ACTIVE`      | Tensor Pipe Active Cycle Ratio — Indicates the fraction of cycles that the Tensor (HMMA/IMMA) Pipe is in the Active state. This value represents the average over a time interval, not an instantaneous value. A higher value indicates higher utilization of Tensor Cores. A value of 1 (100%) means a Tensor instruction is issued every other instruction cycle throughout the time interval (one instruction is completed in two cycles). Assuming the value is 0.2 (20%), possible scenarios include: 20% of the SMs' Tensor Cores run at 100% utilization throughout the time interval; 100% of the SMs' Tensor Cores run at 20% utilization throughout the time interval; 100% of the SMs' Tensor Cores run at 100% utilization for 1/5 of the time interval; other combination modes.                                                                                                              | %    |
| `DCGM_FI_PROF_PIPE_FP64_ACTIVE`        | FP64 Pipe Active Cycle Ratio — Indicates the fraction of cycles that the FP64 (Double Precision) Pipe is in the Active state. This value represents the average over a time interval, not an instantaneous value. A higher value indicates higher utilization of FP64 Cores. A value of 1 (100%) means an FP64 instruction is executed every four cycles (taking Volta-type cards as an example) throughout the time interval. Assuming the value is 0.2 (20%), possible scenarios include: 20% of the SMs' FP64 Cores run at 100% utilization throughout the time interval; 100% of the SMs' FP64 Cores run at 20% utilization throughout the time interval; 100% of the SMs' FP64 Cores run at 100% utilization for 1/5 of the time interval; other combination modes.                                                                                                                                   | %    |
| `DCGM_FI_PROF_PIPE_FP32_ACTIVE`        | FP32 Pipe Active Cycle Ratio — Indicates the fraction of cycles that the Fused Multiply-Add (FMA) pipe is in the Active state, where FMA operations include FP32 (Single Precision) and integers. This value represents the average over a time interval, not an instantaneous value. A higher value indicates higher utilization of FP32 Cores. A value of 1 (100%) means an FP32 instruction is executed every two cycles (taking Volta-type cards as an example) throughout the time interval. Assuming the value is 0.2 (20%), possible scenarios include: 20% of the SMs' FP32 Cores run at 100% utilization throughout the time interval; 100% of the SMs' FP32 Cores run at 20% utilization throughout the time interval; 100% of the SMs' FP32 Cores run at 100% utilization for 1/5 of the time interval; other combination modes.                                                                | %    |
| `DCGM_FI_PROF_PIPE_FP16_ACTIVE`        | FP16 Pipe Active Cycle Ratio — Indicates the fraction of cycles that the FP16 (Half Precision) pipe is in the Active state. This value represents the average over a time interval, not an instantaneous value. A higher value indicates higher utilization of FP16 Cores. A value of 1 (100%) means an FP16 instruction is executed every two cycles (taking Volta-type cards as an example) throughout the time interval. Assuming the value is 0.2 (20%), possible scenarios include: 20% of the SMs' FP16 Cores run at 100% utilization throughout the time interval; 100% of the SMs' FP16 Cores run at 20% utilization throughout the time interval; 100% of the SMs' FP16 Cores run at 100% utilization for 1/5 of the time interval; other combination modes.                                                                                                                                      | %    |
| `DCGM_FI_PROF_DRAM_ACTIVE`             | DRAM Active Cycle Ratio — Indicates the fraction of cycles for memory bandwidth utilization (Memory BW Utilization) to send data to or receive data from device memory. This value represents the average over a time interval, not an instantaneous value. A higher value indicates higher utilization of device memory. A value of 1 (100%) means a DRAM instruction is executed in each cycle throughout the time interval (in practice, a peak of about 0.8 (80%) is the maximum achievable value). Assuming the value is 0.2 (20%), it means 20% of the cycles are used to read or write device memory within the time interval.                                                                                                                                                                                                                                                                      | %    |
| `DCGM_FI_PROF_PCIE_TX_BYTES`           | PCIe Transmit Data Rate — Indicates the data rate transmitted over the PCIe bus, including protocol headers and data payloads. This value represents the average over a time interval, not an instantaneous value. The rate is averaged over the time interval. For example, if 1 GB of data is transmitted in 1 second, the rate is 1 GB/s regardless of whether the data is transmitted at a constant rate or in bursts. The theoretical maximum PCIe Gen3 bandwidth is 985 MB/s per lane.                                                                                                                                                                                                                                                                                                                                                                                                               | B/s  |
| `DCGM_FI_PROF_PCIE_RX_BYTES`           | PCIe Receive Data Rate — Indicates the data rate received over the PCIe bus, including protocol headers and data payloads. This value represents the average over a time interval, not an instantaneous value. The rate is averaged over the time interval. For example, if 1 GB of data is transmitted in 1 second, the rate is 1 GB/s regardless of whether the data is transmitted at a constant rate or in bursts. The theoretical maximum PCIe Gen3 bandwidth is 985 MB/s per lane.                                                                                                                                                                                                                                                                                                                                                                                                                   | B/s  |
| `DCGM_FI_PROF_NVLINK_RX_BYTES`         | NVLink Receive Data Rate — Indicates the data rate received over NVLink, excluding protocol headers. This value represents the average over a time interval, not an instantaneous value. The rate is averaged over the time interval. For example, if 1 GB of data is transmitted in 1 second, the rate is 1 GB/s regardless of whether the data is transmitted at a constant rate or in bursts. Theoretically, the maximum NVLink Gen2 bandwidth is 25 GB/s per link in each direction.                                                                                                                                                                                                                                                                                                                                                                                                                   | B/s  |
| `DCGM_FI_PROF_NVLINK_TX_BYTES`         | NVLink Transmit Data Rate — Indicates the data rate transmitted over NVLink, excluding protocol headers. This value represents the average over a time interval, not an instantaneous value. The rate is averaged over the time interval. For example, if 1 GB of data is transmitted in 1 second, the rate is 1 GB/s regardless of whether the data is transmitted at a constant rate or in bursts. Theoretically, the maximum NVLink Gen2 bandwidth is 25 GB/s per link in each direction.                                                                                                                                                                                                                                                                                                                                                                                                               | B/s  |
| `DCGM_FI_DEV_SM_CLOCK`                 | SM Clock Frequency — Indicates the SM clock frequency.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | MHz  |
| `DCGM_FI_DEV_MEM_CLOCK`                | Memory Clock Frequency — Indicates the memory clock frequency.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | MHz  |
| `DCGM_FI_DEV_APP_SM_CLOCK`             | SM Application Clock Frequency — Indicates the SM application clock frequency.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | MHz  |
| `DCGM_FI_DEV_APP_MEM_CLOCK`            | Memory Application Clock Frequency — Indicates the memory application clock frequency.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | MHz  |
| `DCGM_FI_DEV_CLOCK_THROTTLE_REASONS`   | Clock Throttle Reasons — Indicates the reasons for the clock slowing down.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | MHz  |
| `DCGM_FI_DEV_XID_ERRORS`               | XID Error Number — Indicates the last XID error number that occurred over a period of time.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |      |
| `DCGM_FI_DEV_POWER_VIOLATION`          | Power Violation Duration — Indicates violations caused by power caps, and this value is the duration of the violation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | μs   |
| `DCGM_FI_DEV_THERMAL_VIOLATION`        | Thermal Violation Duration — Indicates violations caused by thermal limits, and this value is the duration of the violation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | μs   |
| `DCGM_FI_DEV_SYNC_BOOST_VIOLATION`     | Sync Boost Violation Duration — Indicates violations caused by sync boost limits, and this value is the duration of the violation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | μs   |
| `DCGM_FI_DEV_BOARD_LIMIT_VIOLATION`    | Board Limit Violation Duration — Indicates violations caused by board limits, and this value is the duration of the violation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | μs   |
| `DCGM_FI_DEV_LOW_UTIL_VIOLATION`       | Low Utilization Violation Duration — Indicates violations caused by low utilization limits, and this value is the duration of the violation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | μs   |
| `DCGM_FI_DEV_RELIABILITY_VIOLATION`    | Board Reliability Violation Duration — Indicates violations caused by board reliability limits, and this value is the duration of the violation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | μs   |
| `DCGM_FI_DEV_BAR1_USED`                | Used BAR1 Memory — Indicates the used amount of BAR1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | MB   |
| `DCGM_FI_DEV_BAR1_FREE`                | Free BAR1 Memory — Indicates the free amount of BAR1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | MB   |
| `DCGM_FI_DEV_MEMORY_TEMP`              | Memory Temperature — Indicates the memory temperature.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | °C   |
| `DCGM_FI_DEV_GPU_TEMP`                 | GPU Temperature — Indicates the GPU temperature.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | °C   |
| `DCGM_FI_DEV_POWER_USAGE`              | GPU Power Usage — Indicates the power consumption.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | W    |
| `DCGM_FI_DEV_TOTAL_ENERGY_CONSUMPTION` | Total Energy Consumption — Indicates the total energy consumed since the driver was loaded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | J    |
| `DCGM_FI_DEV_RETIRED_SBE`              | Retired Pages due to Single-bit Errors — Indicates the pages retired due to single-bit errors.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |      |
| `DCGM_FI_DEV_RETIRED_DBE`              | Retired Pages due to Double-bit Errors — Indicates the pages retired due to double-bit errors.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |      |

## Related[​](#related "Direct link to Related")

* [NVIDIA template source](https://github.com/ccfos/nightingale/tree/main/integrations/NVIDIA): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `dcgm` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/dcgm): every config option and the full metric list.
* [Categraf `nvidia_smi` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/nvidia_smi): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
