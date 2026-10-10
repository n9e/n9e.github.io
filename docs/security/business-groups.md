---
title: "Business group authorization"
sidebar_label: "Business group authorization"
description: "Add teams to a business group with read or write rights, and see the effect on rules and targets."
---

Where this page ends: one business group, plus a list of which teams may read it and which may
write to it. This is layer two of the permission model — layer one is roles, covered in
[Roles and permission matrix](./roles.md).

## Where to find it

There is no "Business groups" item in the sidebar. The page is `/busi-groups`, and three routes
lead to it:

- any page with a business-group panel (**Infrastructure → Hosts**, **Alert rules**, and others) —
  the gear icon next to the panel's **Business group** heading opens it in a new tab;
- **Organization → Users**, by clicking a tag in a user's **Business groups** column;
- the address directly: `https://<your-nightingale>/busi-groups`.

The left of the page lists business groups; the right shows the selected group's details and its
table of authorized teams.

## 1. Create a business group and authorize teams

Click **Add** above the list on the left:

| Field | Notes |
|---|---|
| Business group name | Required. A separator in the name renders as a tree — see below |
| Authorized teams | Required, **at least one**. One team per row, with its rights on the right |
| Rights | **Read-write** or **Read-only** |

Expected result: the group appears in the left-hand list, and the **Authorized teams** table on the
right holds the rows you just entered, with columns for team name, note, rights and actions.

To add teams later, select the group and use **Add teams** at the top right; to revoke, use the
delete action at the end of the row.

## 2. Verify the authorization took effect

Log in as an ordinary account in one of the authorized teams — not an `Admin` — and check:

- **Read-only**: the group and everything under it are visible in Alert rules, Dashboards and
  Hosts, but the create / edit / delete buttons are unavailable;
- **Read-write**: all of those work.

Seeing *nothing at all* usually means layer one was never configured: the person's roles hold no
view permission point such as `/alert-rules`. The two layers are ANDed, so missing either one
leaves the page empty.

## What read-write and read-only actually cover

Authorization applies to the **resources that belong to the group**: alert rules, muting rules,
subscription rules, recording rules, dashboards, hosts and self-healing scripts. Each of them picks
a business group when it is created, and from then on belongs to that group.

Two things fall outside a business group's reach, which read-only members cannot do and read-write
members may not be able to either:

- **Changing the group's own authorization** — adding or revoking teams, renaming, deleting —
  requires the `/busi-groups/put` or `/busi-groups/del` permission point in the role. The built-in
  `Standard` role does hold both.
- **Data sources, notification media and system settings** belong to no business group at all;
  they are `Admin` territory.

## Separators in the name render as a tree

Business groups are a flat table in the database; the UI renders a tree by splitting names on a
separator. So name them like this:

```
DBA/MySQL
DBA/Postgres
K8S/cluster-a
```

Both the separator and the tree-or-list choice live in **System → Site**, as **Business group
separator** and **Business group display mode** (the separator defaults to `-`). This is purely a
display concern — renaming a group moves nothing that belongs to it. For advice on how to divide
groups up in the first place, see [Business groups](../concepts/business-groups.md).

## Two rules that will stop you

- **A group with anything left in it cannot be deleted.** As long as an alert rule, muting rule,
  subscription rule, dashboard, host, recording rule or self-healing script still hangs off the
  group, deletion is refused with `Some ... still in the BusiGroup`. Move or delete the resources
  first, then delete the empty group. A successful delete also clears the group's active alert
  events — with the rules gone, those events would never recover on their own.
- **The last authorized team cannot be revoked.** Revoking when only one is left fails with
  `the business group must retain at least one team`, because nobody would be left to manage the
  group.

## Hosts must be assigned by hand

A host running the collector registers itself, but lands in **Ungrouped**. Someone has to assign it
to a business group before that group's members can see it or write rules for it. This step is
routinely forgotten; the symptom is "it is clearly in the host list, but my colleague says they
cannot see it". See [Targets and heartbeats](../data/categraf/targets.md).

## Next

- Put people into teams: [Users and teams](./users-teams.md)
- Decide which pages those people can reach: [Roles and permission matrix](./roles.md)
- How to divide business groups sensibly: [Business groups](../concepts/business-groups.md)
