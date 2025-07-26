---
title: "Upgrade"
description: "Nightingale monitoring (Nightingale) how to upgrade between different versions, what to pay attention to, and which files to replace"
lead: ""
date: 2025-07-26T13:44:24.685+08:00
lastmod: 2025-07-26T13:44:24.685+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 200
toc: true
---

Nightingale versions V6, V7, and V8 have the same upgrade method between their minor versions.

## Upgrade Steps

1. **Backup Data**: Before upgrading, back up the MySQL database content, binary files, and the `etc` and `integrations` directories. Having a backup allows you to operate confidently.
2. If you are using binary deployment, replace the binary files and the `integrations` directory (you can simply move the old `integrations` directory to a backup location using `mv integrations integrations.bak`, and then use the new `integrations` directory). Compare the new and old configuration files using `diff`, and manually fill in any differences (in practice, you should rarely need to modify the configuration files, as they have not changed much for a long time).
3. If you are using container deployment, pull the latest image, compare the configuration files, fill in any differences, and then restart the container.

## About Database Table Structure

If the database account used by Nightingale has permissions to create and modify tables, you do not need to manually change the database table structure. Nightingale will automatically check if the table structure needs to be upgraded at startup, and if so, it will modify the tables automatically. If the database account does not have permissions to create or modify tables, you will need to make manual adjustments. Recent changes can be found in [migrate.sql](https://github.com/ccfos/nightingale/blob/main/docker/migratesql/migrate.sql). If automatic table modification fails, please submit an [issue](https://github.com/ccfos/nightingale/issues), and we will follow up as soon as possible.

In theory, the database supports both MySQL and Postgres, but the community lacks long-term contributors for Postgres, so it is recommended to use MySQL first.