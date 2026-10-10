---
title: "Integration manifest and payload schema"
sidebar_label: "Integration schema"
description: "The file layout of an integration template, so you can write and contribute one."
---

An integration template is a component's monitoring in one bundle: collector config, dashboards,
alert rules and metric descriptions. Nightingale ships **88 of them** under `integrations/` in the
source repository, loaded into the Components page at startup.

To cover a component that is not there yet, follow this layout and open a pull request.

## Directory layout

One directory per component; the directory name is what shows on the card:

```
integrations/MySQL/
├── icon/
│   └── mysql.png              icon for the card
├── markdown/
│   ├── README.md              collection notes (Chinese)
│   ├── README.en_US.md        collection notes (English)
│   └── mysql.md               further docs, any number
├── collect/
│   └── *.toml                 sample Categraf collector config
├── dashboards/
│   └── *.json                 dashboards, any number
├── alerts/
│   └── *.json                 alert rules, any number
├── metrics/
│   └── *.json                 metric descriptions, feeding the built-in metric views
└── i18n/
    └── en_US.json             translations
```

Every part is optional — a contribution with dashboards but no rules is fine.

## The formats

**`dashboards/*.json`** is the dashboard export format. Build it in the UI, export it, drop it in.

**`alerts/*.json`** is the alert rule export format, either one object or an array. The fields that
matter: `name`, `cate`, `prod`, `severity`, `rule_config` (since v6 the queries live in its
`queries` array and the top-level `prom_ql` stays empty), `prom_eval_interval`,
`prom_for_duration`, `append_tags`, `annotations`. Full field list in
[Import, export and reuse](../alerting/import-export.md).

**`metrics/*.json`** describes what metrics the component emits and what each means, feeding the
product's **built-in metric views**. There are over 1300 built in.

**`collect/*.toml`** is a sample Categraf configuration. Note that in the open-source build these
files are **only used by the AI documentation index**; the collection wizard on the host list uses a
separate frontend catalogue plus `public/n9e-collect-templates/*.toml`.

**`i18n/en_US.json`** is a key/value map with the Chinese original as the key.
`GET /api/n9e/builtin-payloads` returns names in the language of the request's `X-Language` header.

## When it loads

The `n9e` process reads `integrations/` next to the binary at startup. **Changes need a restart** to
show up.

Templates created by hand in the Components page live in the database and are merged with the ones
from disk; on a name collision **the database row wins**.

## Contributing

Add a directory under `integrations/` in [ccfos/nightingale](https://github.com/ccfos/nightingale)
and open a PR. Run the whole bundle in your own environment first — dashboards drawing real data,
rules actually firing — rather than submitting JSON alone.

## Related

- [Import dashboards and rules](../data/integrations/import.md)
- [Install collector configuration](../data/integrations/collector-config.md)
- [Import, export and reuse](../alerting/import-export.md)
