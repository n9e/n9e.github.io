---
title: "Contact methods"
sidebar_label: "Contact methods"
description: "Define the contact fields users can fill in, and how a media type picks one of them to decide where each person's notification goes."
last_reviewed: 2026-10-10
---

Where this page ends: the user form offers exactly the contact fields your media types need — a
WeCom user ID, an internal IM handle, a pager number — and a notification rule that names people
or teams knows which address to use for each of them.

## What a contact method is

Every user has a **phone** and an **email** as fixed fields. Everything else — robot tokens, IM
account IDs, anything your own integrations need — is a **contact method**: an entry in a list the
administrator maintains, which then appears as a key users can fill in under **Contact** on their
profile.

| Part of an entry | Notes |
|---|---|
| Name | What users see in the dropdown |
| Identifier | The key the value is stored under, and what a media type refers to. Letters, digits, `_` and `-` only |
| Enabled | Turned off, it disappears from every dropdown |

## Where to manage the list

Only `Admin` can edit it, from any of three places — they all open the same list:

- the link next to **Contact** in the user form (**Organization → Users → Add / Edit**). In the
  English UI it reads **Please go to the settings page to add**;
- the same link on your own profile page;
- the gear icon next to **Contact** in a media type's **Variable configuration**.

The list is also available as a page of its own at `/contacts`.

Click **Add**, enter a name and an identifier, keep it enabled, and save. Changes apply
immediately; there is nothing to restart.

## What a fresh install starts with

**On a new v9 install the list is empty.** Users will see no contact keys to fill in until you add
the ones you need.

Installs upgraded from earlier versions keep the six built-in entries those versions created:

| Identifier | Used for |
|---|---|
| `dingtalk_robot_token` | DingTalk group robot token |
| `wecom_robot_token` | WeCom group robot key |
| `feishu_robot_token` | Feishu group robot token |
| `lark_robot_token` | Lark group robot token |
| `telegram_robot_token` | Telegram bot token |
| `mm_webhook_url` | Mattermost webhook URL |

Built-in entries can be disabled but not deleted, and their identifier cannot be edited. They date
from when each person's robot token lived on their profile; in v9 the usual path is to put the
robot token in the notification rule instead, as described in
[DingTalk / Feishu / WeCom](../notifications/dingtalk-feishu-wecom.md).

## How a media type uses it

A media type that sends to people — [Callback](../notifications/callback.md),
[Script](../notifications/script.md) and the HTTP-based types — has a **Contact** dropdown under
**Variable configuration**. It lists `phone`, `email`, and every enabled contact method.

When a notification rule picks users or teams for that media type, Nightingale takes each person's
value for the chosen key:

1. A person who has not filled that key is **skipped silently** — no error, no retry.
2. The remaining values become `$sendto` / `$sendtos` in HTTP templates, or `sendtos` on a
   script's stdin.

So "why did this person get nothing?" starts here: open their profile and check that the key the
media type uses is filled in.

## A worked example: send by WeCom user ID

Say an internal service sends WeCom app messages and needs each recipient's WeCom user ID.

1. Add a contact method: name `WeCom user ID`, identifier `wecomid`.
2. Have people fill it in on their profile, or fill it in for them in the user form.
3. On a Callback media type, set **Contact** to `WeCom user ID` and send the list in the body:

   ```text
   {"touser": {{ jsonMarshal $sendtos }}, "text": {{ jsonMarshal $tpl.content }}}
   ```

4. In the notification rule, pick teams as recipients. Everyone in them with a `wecomid` is
   included in one request.

## Changing or removing an entry

- **Disabling** hides the key from the user form and from media type dropdowns. Values people
  already filled in stay on their profiles, and a media type that already points at the key keeps
  sending with it.
- **Changing the identifier** of a custom entry does not move existing values — they stay stored
  under the old key, and media types still pointing at the old key keep using it. Treat the
  identifier as permanent.
- **Deleting** a custom entry removes it from the list only; stored values are not cleaned up.

## Next

- Where people's details are filled in: [Users and teams](./users-teams.md)
- Use the addresses in a request: [Callback (generic webhook)](../notifications/callback.md)
- Or in your own program: [Script media type](../notifications/script.md)
