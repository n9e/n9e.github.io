# Script media type

Hand events to your own program: how the script is stored and run, what arrives on stdin, and how success and failure are recorded.

Last reviewed 2026-10-10

Where this page ends: every event a notification rule matches is handed to a program you wrote — a shell or Python script that calls an internal SMS gateway, writes to a queue, or does anything an HTTP callback cannot.

Reach for this only when [Callback](https://n9e.github.io/docs/notifications/callback.md) is not enough. A script runs **on the alert engine's machine, as the engine's user**, so it is more powerful and also easier to get wrong.

## 1. Create the media type[​](#1-create-the-media-type "Direct link to 1. Create the media type")

**Alerts & Notifications → Media types → Add**, and pick **Script** in the type panel.

| Field             | Notes                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Script / Path     | Two ways to supply the program — see below                                                                                                                                           |
| Timeout           | Milliseconds, 5000 by default. The process is killed when it runs over                                                                                                               |
| Contact           | Under **Variable configuration**: which contact field to collect from the users and teams picked in the rule; see [Contact methods](https://n9e.github.io/docs/security/contacts.md) |
| Custom parameters | Under **Variable configuration**: fields that appear in the notification rule; your script reads them from `params`                                                                  |

### Script: paste the content[​](#script-paste-the-content "Direct link to Script: paste the content")

The content is saved with the media type. When it first runs, the engine writes it to a file named `.notify_script_<media type id>` **in the engine's working directory**, makes it executable, and runs that file. The file is rewritten only when the content changes.

The file is executed directly, not through a shell, so **the first line must be a shebang**:

```
#!/usr/bin/env python3
```

Without one, every run fails with `exec format error`. The interpreter it names has to be installed on the engine's machine.

### Path: point at an existing file[​](#path-point-at-an-existing-file "Direct link to Path: point at an existing file")

The engine runs the file at that path. Use an absolute path; a relative one resolves against the engine's working directory. The file must exist and be executable **on every machine that runs an alert engine** — `n9e` itself, and every `n9e-edge` or standalone alert engine — because the notification is sent by whichever engine evaluated the rule.

## 2. What the script receives[​](#2-what-the-script-receives "Direct link to 2. What the script receives")

Nothing on the command line. Everything arrives as **one JSON object on stdin**:

| Key       | What it holds                                                                         |
| --------- | ------------------------------------------------------------------------------------- |
| `event`   | The first event of this send                                                          |
| `events`  | Every event of this send, as an array                                                 |
| `tpl`     | The message template picked on the rule, already rendered; one key per template field |
| `params`  | The custom parameters filled in on the notification rule                              |
| `sendtos` | The recipients' addresses for the chosen Contact, as an array                         |

Event fields are the same as in the history table; see [Notification variables](https://n9e.github.io/docs/reference/notification-variables.md). Users without the chosen contact are already left out of `sendtos`.

A minimal script that forwards each event to an internal gateway:

```
#!/usr/bin/env python3

import json, sys, urllib.request



data = json.load(sys.stdin)

for ev in data["events"]:

    body = json.dumps({

        "to": data["sendtos"],

        "title": ev["rule_name"],

        "severity": ev["severity"],

        "recovered": ev["is_recovered"],

        "text": data["tpl"].get("content", ""),

    }).encode()

    req = urllib.request.Request(

        "http://sms-gw.internal/send", data=body,

        headers={"Content-Type": "application/json"})

    urllib.request.urlopen(req, timeout=3)



print("sent", len(data["events"]))
```

To see the exact input once, write `sys.stdin.read()` to a file on the first run.

## 3. How a run is judged[​](#3-how-a-run-is-judged "Direct link to 3. How a run is judged")

| Outcome              | Recorded as                                        |
| -------------------- | -------------------------------------------------- |
| Exit code 0          | Success                                            |
| Non-zero exit code   | Failure, `failed to execute script: exit status N` |
| Ran past the timeout | Failure, `timeout and killed process`              |

stdout and stderr are captured together; the **first 512 bytes** become the response in the notification record, so print a short status line rather than a full dump. Each run is also logged by the engine as `event_script_notify_result`, including the full output and the stdin it was given.

Script sends are **not retried** and do not go through a queue: one run per send, done in place. If the target can fail transiently, retry inside the script.

## 4. Testing[​](#4-testing "Direct link to 4. Testing")

**A script media type must be saved before it can be tested.** Testing an unsaved one would mean writing request content to disk and executing it, so the media type form's test refuses with "Script media types must be saved before testing". Save first, then use **Run test** on a notification rule that uses it; that runs the saved script with an event. See [Test a notification end to end](https://n9e.github.io/docs/notifications/test.md).

## What catches people out[​](#what-catches-people-out "Direct link to What catches people out")

* **Missing shebang.** The most common failure: `exec format error`.
* **Works by hand, fails from the engine.** The engine's user, `PATH` and working directory are not your login shell's. Use absolute paths for every command and file the script touches.
* **Path mode on a multi-engine install.** The file exists on one machine but the rule is evaluated by an engine on another; that engine fails with "no such file".
* **Anyone who can edit media types can run code on the engine's machine.** Grant that permission accordingly; see [Roles and permission matrix](https://n9e.github.io/docs/security/roles.md).

## Next[​](#next "Direct link to Next")

* Wire it into a rule: [Notification rules](https://n9e.github.io/docs/notifications/rules.md)
* The HTTP alternative: [Callback (generic webhook)](https://n9e.github.io/docs/notifications/callback.md)
* Where addresses in `sendtos` come from: [Contact methods](https://n9e.github.io/docs/security/contacts.md)
