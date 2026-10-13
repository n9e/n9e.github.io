# Monitor AMD ROCm SMI with Nightingale

Runs rocm-smi to collect AMD GPU utilization, memory, temperature, power and clocks; rules cover overheating and full memory.

Last reviewed 2026-10-13

The AMD ROCm SMI input is ported from Telegraf. It runs the `rocm-smi` binary that ships with ROCm and parses the output into per-GPU utilization, memory usage, temperature, power draw, fan speed and clock frequencies.

ROCm must be installed on the host; the default binary path is `/opt/rocm/bin/rocm-smi`, adjustable via `bin_path`. The rules fire on high temperature, exhausted memory and power close to the cap.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **4 alert rules**, each with runbook steps
* **Categraf collector config**: `input.amd_rocm_smi`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.amd_rocm_smi/rocm.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.amd_rocm_smi started` once the plugin is loaded.

   ```
   # Query statistics from AMD Graphics cards using rocm-smi binary

   # bin_path = "/opt/rocm/bin/rocm-smi"



   ## Optional: timeout for GPU polling

   # timeout = "5s"
   ```

2. Open the integration center in Nightingale, find AMD ROCm SMI, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

4 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### AMD GPU memory usage too high[​](#amd-gpu-memory-usage-too-high "Direct link to AMD GPU memory usage too high")

S2 Warning · for 5 min · Trigger:

```
amd_rocm_smi_memory_used / (amd_rocm_smi_memory_total > 0) * 100 > 90
```

Runbook:

1. Take gpu\_id and name from the alert labels and run rocm-smi --showmemuse --showpids to see which processes hold the memory;
2. If a zombie process has exited without releasing memory, confirm nobody is using it and kill it to free the memory;
3. If the training job genuinely needs that much memory, reduce the batch size or enable gradient accumulation and mixed precision;
4. When several jobs share one card, switch to memory isolation or queued scheduling so they do not squeeze each other into failure.

### AMD GPU junction temperature too high[​](#amd-gpu-junction-temperature-too-high "Direct link to AMD GPU junction temperature too high")

S1 Critical · for 3 min · Trigger:

```
amd_rocm_smi_temperature_sensor_junction > 95
```

Runbook:

1. Take gpu\_id from the alert labels and run rocm-smi --showtemp --showfan --showpower to check temperature, fan speed, and power draw;
2. If the fan speed is low, check whether the fan has failed or is clogged with dust and clean it during a maintenance window if needed;
3. If the fan is already at full speed and it is still hot, check the chassis airflow and data centre intake temperature, and whether neighbouring slots are too densely populated;
4. In the short term you can limit heat with rocm-smi --setpoweroverdrive to cap power, but the cooling problem must be fixed promptly.

### AMD GPU edge temperature too high[​](#amd-gpu-edge-temperature-too-high "Direct link to AMD GPU edge temperature too high")

S2 Warning · for 5 min · Trigger:

```
amd_rocm_smi_temperature_sensor_edge > 85
```

Runbook:

1. Take gpu\_id from the alert labels and run rocm-smi --showtemp --showclocks to compare temperature with the current clocks and confirm whether it is already throttling;
2. Check the temperature of the other GPUs on the same machine; if they are all high it is a chassis- or room-level cooling problem;
3. If only one card is hot, check that card's fan, thermal paste, and mounting position;
4. While fixing cooling, evaluate whether to reduce job concurrency on that card so it does not run throttled for long periods.

### AMD GPU memory temperature too high[​](#amd-gpu-memory-temperature-too-high "Direct link to AMD GPU memory temperature too high")

S2 Warning · for 5 min · Trigger:

```
amd_rocm_smi_temperature_sensor_memory > 95
```

Runbook:

1. Take gpu\_id from the alert labels and run rocm-smi --showtemp to compare the memory temperature with the junction temperature;
2. A memory temperature well above the junction temperature usually means poor contact on the memory heatsink and requires a maintenance window to inspect;
3. Check whether long-running high memory bandwidth workloads (such as large model inference) are involved and reduce concurrency to relieve it;
4. Also run rocm-smi --showretiredpages to check for bad pages; growing bad pages mean the memory is degrading and the card should be scheduled for replacement.

## Related[​](#related "Direct link to Related")

* [AMD ROCm SMI template source](https://github.com/ccfos/nightingale/tree/main/integrations/AMD_ROCm_SMI): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `amd_rocm_smi` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/amd_rocm_smi): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
