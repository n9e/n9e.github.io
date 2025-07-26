---
title: "Business Groups"
description: "The concept of business groups in Nightingale monitoring, how to divide business groups, and the related design intentions. The division of business groups is similar to the service tree; usually, the top layer is organizational structure modeling, the middle layer is system service modeling, and the bottom layer is cluster division."
date: 2025-07-26T17:17:34.037+08:00
lastmod: 2025-07-26T17:17:34.037+08:00
draft: false
images: []
menu:
  docs:
    parent: "usecase"
weight: 10000
toc: true
---

Nightingale needs to manage many things, such as: alert rules, shielding rules, subscription rules, self-healing scripts, dashboards. When creating these things, you must first select a business group because these things must belong to a certain business group. The same goes for machines. After installing categraf, categraf will automatically register machine information with Nightingale. At this time, the machine will appear in the list of ungrouped machines. Administrators need to assign the machine to a certain business group so that members of the business group can use it.

Business groups are frequently used in Nightingale. This article explains the concept of business groups in Nightingale monitoring and related design intentions.

## Source of Demand

Nightingale needs to manage many things, such as: alert rules, shielding rules, subscription rules, self-healing scripts, machines, etc. If all these things are placed in a single table for everyone to view and manage, it will be quite chaotic, so a mechanism for classification is needed.

Therefore, we introduced the concept of "business groups". A business group is a grouping mechanism. For example, DBAs can put MySQL alert rules in one business group (let's call it `DBA/MySQL`) and Postgres alert rules in another business group (let's call it `DBA/Postgres`); for example, Kubernetes operation and maintenance personnel split Kubernetes hosts by cluster, and place machines from different clusters in different business groups, such as `K8S/ClusterA`, `K8S/ClusterB`, etc.

## Evolution

In early versions of Nightingale, business groups were displayed as a flat list. Later, it was found that business groups actually need a hierarchical structure. For example, the four business groups mentioned above:

- `DBA/MySQL`
- `DBA/Postgres`
- `K8S/ClusterA`
- `K8S/ClusterB`

It is more convenient to view them when rendered as a tree structure:

```
DBA
├── MySQL
└── Postgres
K8S
├── ClusterA
└── ClusterB
```

Therefore, in the new version of Nightingale, for compatibility with older versions, business groups are still stored in the database as a flat list, but in the front-end display, they can be rendered as a tree structure according to the delimiter in the name. For example, in the above example, the delimiter in the name is `/`, but you can also use other delimiters such as `-`, `_`, etc. In Nightingale's menu `System Configuration - Site Settings`, you can set the business group display mode and delimiter.

> 🟢 It is recommended to use `/` as the delimiter.

## Issues

In Nightingale, business groups are globally shared. You can attach rules to business groups and also attach machines to business groups. This has the advantage of facilitating the reuse of business groups, that is, once a business group is created, it can be used in multiple places.

However, this approach has a problem: different things have different granularities of grouping. For example, when grouping machines, we may divide them more finely, such as:

- `DBA/MySQL/Proxy/RegionA`
- `DBA/MySQL/Proxy/RegionB`

But when grouping alert rules, dashboards, etc., we may not divide them as finely. For example, all dashboards of DBAs may be placed directly under DBA.

This problem is currently difficult to solve unless business groups are not made globally reusable. Machines have their own grouping, alert rules have their own grouping, and dashboards have their own grouping. This will lead to the need to create some business groups repeatedly—after creating them for machines, you have to create them again for alert rules. You can't have both.

## Best Practices for Dividing Business Groups

Although business groups can be used for classifying various rules and grouping machines, their granularities are different. Usually, the granularity of machine grouping is finer, while that of rule grouping is coarser. Generally, plan business groups according to machine grouping first, and then attach various rules, dashboards, etc., to the middle-level business groups, which is almost sufficient. Let's first talk about machine grouping.

I wonder if readers have heard of the concept of "service tree". The division of business groups is similar to the "service tree". Generally speaking, the top layer is the modeling of the organizational structure, that is, the top-level nodes are information such as departments, businesses, teams, etc. For example:

- `Infrastructure/Ops/Container Cloud` refers to the container cloud team in the operation and maintenance team
- `Infrastructure/Ops/Database` refers to the database operation and maintenance team in the operation and maintenance team
- `XBU/Business1/Product1` refers to the Product1 team under Business1 of a certain BU
- `XBU/Business1/Product2` refers to the Product2 team under Business1 of a certain BU

If the company's organizational structure is relatively flat, the hierarchy of this information will be fewer. If the company's organizational structure has many levels, more levels can be added.

The top layer is the modeling of the organizational structure, and the middle layer is the modeling of system services. Usually, the middle layer is divided into two layers: `system`-`module`. For example, Kubernetes is a system, and apiserver, etcd, scheduler, etc., are different modules in it.

Finally, the bottom layer of business groups is usually divided by clusters. For example, if the quantity is really large, the concept of region can be introduced above the cluster. If the quantity is not that large, it is only necessary to divide by cluster. If there is only one cluster, it is even possible to cancel the bottom cluster node.

Therefore, the business groups of the final container cloud platform may be divided as follows:

- `Infrastructure/Ops/Container Cloud/KubeUI/Webapi/South China Cluster`
- `Infrastructure/Ops/Container Cloud/KubeUI/Webapi/North China Cluster`
- `Infrastructure/Ops/Container Cloud/KubeUI/Report/South China Cluster`
- `Infrastructure/Ops/Container Cloud/KubeUI/Report/North China Cluster`
- `Infrastructure/Ops/Container Cloud/Kubernetes/etcd/South China Cluster`
- `Infrastructure/Ops/Container Cloud/Kubernetes/etcd/North China Cluster`
- `Infrastructure/Ops/Container Cloud/Kubernetes/apiserver/South China Cluster`
- `Infrastructure/Ops/Container Cloud/Kubernetes/apiserver/North China Cluster`
- `Infrastructure/Ops/Container Cloud/Kubernetes/scheduler/South China Cluster`
- `Infrastructure/Ops/Container Cloud/Kubernetes/scheduler/North China Cluster`
- `Infrastructure/Ops/Container Cloud/Kubernetes/node/South China Cluster`
- `Infrastructure/Ops/Container Cloud/Kubernetes/node/North China Cluster`

After business groups are divided according to the granularity of machines, rules and the like should be attached to the upper layers. For example, for Webapi alert rules, a special business group `Infrastructure/Ops/Container Cloud/KubeUI/Webapi-Rules` can be created, and then Webapi alert rules can be attached to this business group.

If there are few alert rules for Webapi and Report, it is also possible to directly create a `Infrastructure/Ops/Container Cloud/KubeUI-Rules` business group and attach all alert rules for Webapi and Report to this business group.

There are usually even fewer dashboards. You can directly create a `Infrastructure/Ops/Container Cloud-Dashboards` business group and attach all dashboards of the container cloud team to this business group.

Of course, the above division logic is just a reference and cannot be applied to all companies. For example, some enterprises mainly use Nightingale to monitor a large number of devices (scattered in different regions and factories) rather than services. In this case, when dividing business groups, you can consider dividing them according to dimensions such as regions and factories.

## FAQ

### Can't Find the Business Group Operation Entry

**Question**: In the new V8 version, why can't I find the business group menu under the personnel organization? How to add, delete, modify, and query business groups?

**Answer**: Business groups appear under many function menus, such as alert rules, shielding rules, dashboards, self-healing scripts, etc. You can directly add, delete, modify, and query business groups in these places, and there is no need to go to a separate business group menu. Move the mouse to the business group, an edit icon will automatically appear. Click the edit icon to edit or delete the business group. There is a small plus icon on the business group, which can be used to add a new business group.