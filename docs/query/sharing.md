# Anonymous time-limited sharing

Share one dashboard through a link that expires, without creating an account for the viewer.

Last reviewed 2026-10-10

Where this page ends: a link that expires on its own, letting someone without a Nightingale account open exactly one dashboard — and that you can revoke at any point before it expires.

## 1. Generate a time-limited link[​](#1-generate-a-time-limited-link "Direct link to 1. Generate a time-limited link")

The entry point is not on the dashboard itself, it is on the list: **Explorer → Dashboards**, find the row, and click the pencil icon in the **Public** column.

Top to bottom in the dialog:

| Option     | What it means                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Public     | Choose **Public** — the type selector only appears afterwards                                                      |
| Type       | **Anonymous access** / Login access / Authorized access. For someone without an account, pick **Anonymous access** |
| Note       | Required. One dashboard can carry several live links; without a note you cannot tell which one to revoke           |
| Expiration | A number plus a unit (hours / days / months / years), 30 days by default                                           |
| Theme      | System / Dark / Light. Affects only the link you copy, not the token itself                                        |

Once **Anonymous access** is selected, the lower half of the dialog expands into **Sharing link (anonymous access)**. Fill in the note and expiration, then click **Generate link**.

If the dashboard is not already stored as "Public — Anonymous access", a confirmation asks whether to change that too. Confirming saves the public setting first, then issues the link. **Do not skip it**: a link works regardless of the public setting, so if the setting is left alone, the **Public** column gives no hint that this dashboard is exposed.

Expected result: a new row in the table below with note, link, expiry and creator. The link looks like this:

```
https://<your-nightingale>/dashboards/share/<dashboard id>?__token=<uuid>
```

## 2. Check it yourself before sending it[​](#2-check-it-yourself-before-sending-it "Direct link to 2. Check it yourself before sending it")

Open the link in a private window. It should render the dashboard directly, **with no side menu and no redirect to the login page**.

Landing on the login page means the token did not take effect — most often because `?__token=...` was lost while copying.

## 3. Revoke before it expires[​](#3-revoke-before-it-expires "Direct link to 3. Revoke before it expires")

Back in the same dialog, click **Revoke** on the row. The link stops working immediately, and the action cannot be undone.

Expired links stay in the table (marked `expired`) rather than disappearing, so you can clean them up in the same place.

## What the link holder can do[​](#what-the-link-holder-can-do "Direct link to What the link holder can do")

They can:

* open **that one** dashboard without logging in, for as long as the link is valid;
* query the data sources the dashboard references — the ones hard-coded in panels, plus every source of the same category expanded from a "Datasource"-type variable.

They cannot:

* **Open a different dashboard.** A token is bound to one dashboard id; using a valid link against another dashboard is rejected outright, even if that dashboard allows anonymous access on its own.
* **Reach a data source outside the dashboard.** A request for a source not in the dashboard's set returns 403.
* **Write anything.** SQL data sources are forced through a strict read-only check on this channel, and proxied requests only pass read-only query endpoints (`/api/v1/query`, `_search`, `/select/logsql/` and similar). `_bulk`, `/-/reload` and the like are refused.

Two things that catch people out:

* **A link's validity is decoupled from the public setting.** The token is checked before the public/login decision, so switching the dashboard back to "Not public" does **not** kill links already handed out. When you change the type, the UI warns that "this dashboard still has N sharing link(s) that have not expired" and offers to revoke them — answer it properly.
* **There is no "never expires".** The ceiling is 99 years; for long-term exposure set the unit to years. It stays a revocable link rather than becoming a permanent switch.

## When the link cannot be issued[​](#when-the-link-cannot-be-issued "Direct link to When the link cannot be issued")

* **The dashboard uses a "Host ident" variable.** That variable type needs an authenticated API, so an anonymous viewer would get nothing. The generate button is disabled with "The dashboard has been configured with a host\_ident variable and cannot be accessed anonymously". Replace it with a plain query variable first.
* **The dashboard config could not be read.** Generation is disabled the same way ("Could not read the dashboard config"). That is deliberate: unknown means not allowed.
* **Insufficient permission.** Issuing, listing and revoking all require dashboard write permission plus read-write membership of the business group. A read-only member sees none of it — being able to list links is the same as being able to forward a working anonymous link.

## Two other kinds of sharing, with different properties[​](#two-other-kinds-of-sharing-with-different-properties "Direct link to Two other kinds of sharing, with different properties")

* **Temporary chart link.** The chart in the Metrics explorer has a share icon; it stores the current query as a temporary chart and gives you a `/chart/<id>` link that opens without login (it relies on `PromQuerier` under `[Center.AnonymousAccess]`, on by default). **It has no expiry and no revoke.** Fine as a replacement for a screenshot; not a controlled way to expose data.
* **Alert event detail sharing.** An event detail page can issue its own time-limited link (7 days by default) with the same mechanism, but it shares one event rather than a dashboard. See [Active and historical events](https://n9e.github.io/docs/events/active-historical.md).

## Next[​](#next "Direct link to Next")

* Embedding all of Nightingale into another system rather than sharing one board: [Share, embed and integrate external systems](https://n9e.github.io/docs/query/embedding.md)
* Configuring the variables on the board: [Variables and filters](https://n9e.github.io/docs/query/variables.md)
* Who is allowed to edit the board: [Business groups](https://n9e.github.io/docs/concepts/business-groups.md)
