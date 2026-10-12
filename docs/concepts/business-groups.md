# Business groups and resource ownership

Business groups are the permission boundary: every rule, target and dashboard belongs to one, and membership decides who can see or change it.

The business group is **the only permission boundary** in Nightingale. Understanding it clears up most permission confusion.

## It is two things at once[​](#it-is-two-things-at-once "Direct link to It is two things at once")

**A grouping.** Alert rules, mute rules, subscriptions, self-healing scripts, hosts and dashboards all pick a business group at creation time. Without that, everything piles into one table and becomes unusable somewhere past a few hundred rules.

**An authorization.** The members of a business group are **teams**, not individual users, and each team carries a read/write flag:

* `read-only` — can see what is in the group, cannot change it;
* `read-write` — can change it.

Whether a user may edit a given alert rule comes down to: which teams they are in → whether any of those teams has write on the business group that owns the rule.

## Names carry the hierarchy[​](#names-carry-the-hierarchy "Direct link to Names carry the hierarchy")

Business groups are a **flat list** in the database, but the UI renders a tree from a separator in the name. So name them like this:

```
DBA/MySQL

DBA/Postgres

K8S/cluster-a

K8S/cluster-b
```

and the UI shows:

```
DBA

├── MySQL

└── Postgres

K8S

├── cluster-a

└── cluster-b
```

The separator is configurable under **System → Site**; `/` is the recommended one. This is purely presentational — renaming a group does not move anything that belongs to it.

## Hosts must be placed by hand[​](#hosts-must-be-placed-by-hand "Direct link to Hosts must be placed by hand")

A host with categraf installed registers itself, but lands in **Ungrouped**. An administrator has to assign it to a business group before that group's members can see it or write rules against it.

This step gets forgotten regularly. The symptom is "the host is clearly in the list, but my colleague says they cannot see it".

## How to divide them up[​](#how-to-divide-them-up "Direct link to How to divide them up")

Divide by **who is responsible**, not by technology. The test: *when something in this group breaks, is it the same people who deal with it?*

* one group per product line is common;
* infrastructure split by team (DBA, network, K8s platform) is common;
* splitting by site or environment usually works less well, because on-call rotas are not organised by site.

Too fine, and writing a rule means switching groups constantly. Too coarse, and the permission boundary means nothing.

## Related[​](#related "Direct link to Related")

* [Business group authorization](https://n9e.github.io/docs/security/business-groups.md)
* [Roles and permission matrix](https://n9e.github.io/docs/security/roles.md)
* [Authentication, tokens and RBAC model](https://n9e.github.io/docs/concepts/auth-rbac.md)
