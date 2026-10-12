---
title: "Secret management"
sidebar_label: "Secret management"
description: "Keep database passwords, channel tokens and LLM keys out of config files."
last_reviewed: 2026-10-10
---

Where this page ends: an accurate list of which credentials can be moved, how to move them, and
where the rest live. It starts with what the product actually offers, because this is the area
people most often configure from imagination.

## The two mechanisms that exist

They do not overlap; each covers a different half:

| Mechanism | Covers | Where the key lives |
|---|---|---|
| Config-file field encryption (`--crypto-key`) | **Six** fields in `etc/*.toml` | The string passed on the command line |
| Encrypted variables (**System → Variable**) | The configuration bodies of media types, SMTP and SSO | An RSA key pair generated and stored in the database |

**These do not exist — do not go looking:**

- There is no mechanism for overriding arbitrary config keys from the environment. There is no
  `N9E_DB_DSN`; configuration is read from the toml files under `etc/` and nowhere else. See
  [Environment variables](../reference/environment-variables.md).
- There is no integration with an external secret manager (Vault, a cloud KMS).
- **Data source credentials and LLM API keys are covered by neither mechanism** — they live only in
  their own tables.

## 1. Turn the six config-file fields into ciphertext

These six are the whole set. Any other field beginning with `{{cipher}}` is never decrypted; it is
used as a literal:

```
[DB]                              DSN
[Redis]                           Password
[HTTP.APIForService.BasicAuth]    every value
[HTTP.APIForAgent.BasicAuth]      every value
[[Pushgw.Writers]]                BasicAuthPass
[EmbeddedTSDB]                    BasicAuthPass
```

Ciphertext is a `{{cipher}}` prefix followed by base64, decrypted at startup with the key given to
`--crypto-key`. **Values without the prefix are used as-is**, so plaintext and ciphertext can be
mixed in one file and you can convert one field at a time.

There is exactly one product-native way to produce the ciphertext, and it lives under the
`[HTTP.APIForService]` endpoints — **which are off by default**, with no CLI subcommand as an
alternative. So the order is:

1. Temporarily enable that group, replace the sample credentials shipped in the config file with
   your own (the shipped ones are public knowledge), bind `[HTTP] Host` to `127.0.0.1` for the
   duration, and restart:

   ```toml
   [HTTP]
   Host = "127.0.0.1"
   [HTTP.APIForService]
   Enable = true
   [HTTP.APIForService.BasicAuth]
   <your username> = "<a passphrase you generate>"
   ```

2. Call the encrypt endpoint once, from that machine. The `key` must be **16, 24 or 32 bytes**;
   any other length returns 400:

   ```bash
   curl -u '<your username>:<your passphrase>' \
     -X POST http://127.0.0.1:17000/v1/n9e/conf-prop/encrypt \
     -H 'Content-Type: application/json' \
     -d '{"data":"<the plaintext>","key":"<16/24/32-byte key>"}'
   ```

3. The `encrypt` field of the response is what goes back into the config file:

   ```json
   {"src":"...","key":"...","encrypt":"{{cipher}}rBkS0m....=="}
   ```

4. Put it in `etc/config.toml` and start with the **same** key:

   ```bash
   ./n9e --crypto-key '<the key from step 2>'
   ```

5. Decide whether to turn `[HTTP.APIForService]` back off. Edge mode, a standalone alert process
   and variable decryption all need it permanently on; a single-node deployment should switch it
   off and restore `[HTTP] Host`.

Expected result: the process starts and connects to the database. With the wrong key, startup fails
outright with `failed to decrypt the db dsn` in the log — it does not fall back to plaintext and
does not start silently.

All four binaries (`n9e`, `n9e-alert`, `n9e-pushgw`, `n9e-edge`) accept `--crypto-key`, and a split
deployment must give them the same key.

**Where the key itself goes**: `--crypto-key` is a command-line flag, so it will appear in `ps`
output and any user on the host can read it. That cannot be worked around. What you can do is limit
who can log in to the host, and keep the key out of version control and shell history — have the
systemd unit or container entrypoint read it from a root-only file and assemble the command line.
The product does not handle this layer; the deployment does.

## 2. Credentials entered in the UI: encrypted variables

Media type tokens, SMTP passwords and SSO client secrets are entered in the UI rather than in a
config file, so they take the other route: create an encrypted variable under
**System → Variable**, then reference it from the configuration as `{{.variable_name}}`.

The value is encrypted **in the browser** with an RSA public key before it is sent, cannot be read
back through the UI afterwards (the list shows `******`), and is masked to `***` in logs and
notification records. The full rules and limits are in
[Site and user variable settings](./variables.md).

Be clear about the boundary: **the RSA private key sits in the same `configs` table as the
ciphertext.** This layer defends against a colleague with system-settings permission casually
reading a credential, and against credentials landing in logs. It does not defend against anyone
who can read the database.

## 3. Where the remaining credentials live

| Credential | Stored in | Encryptable |
|---|---|---|
| User passwords | The `users` table | Salted hash, not reversible. But one salt serves the whole site, so weak passwords still fall to offline cracking |
| Personal tokens | The `user_token` table | Plaintext UUIDs, revoked by deletion — see [Tokens and credential rotation](./tokens.md) |
| Data source credentials, certificates, headers | The `datasource` table | Neither mechanism reaches these. They are stripped from records returned to non-admins |
| LLM API keys | The `ai_llm_config` table | The same |
| Media type tokens, SMTP passwords | Media type configuration | Can be changed to reference an encrypted variable |
| SSO client secrets and bind passwords | The `sso_config` table | The same |
| RSA private key, JWT signing key, password salt | The `configs` table | Generated automatically; nothing to do, but they set the sensitivity of the database |

The thing to take away from that table: **only a minority can be encrypted, and for most
credentials the real boundary is the database itself.**

## 4. Three things the deployment has to cover

What the product does not reach has to be handled in deployment. These three pay best:

1. **File permissions on the config.** Even with all six fields encrypted, the file still carries
   the database address, the Redis address and the write targets — topology worth having.
   `chmod 600`, owned by the user the process runs as.
2. **Keep config files out of version control.** Version a template instead and inject values at
   deploy time; for multiple environments, point `N9E_CONFIGS` (or `--configs`) at different
   directories — the plainest approach and the easiest to audit. See
   [Environment variables](../reference/environment-variables.md).
3. **Treat the database as the real boundary.** Password hashes, tokens, data source credentials
   and the RSA private key are all in it. Give the database account least privilege, expose it on
   the network to Nightingale only, and encrypt backups at rest — see
   [Backup and restore](../operations/backup-restore.md).

## Next

- The full rules for encrypted variables: [Site and user variable settings](./variables.md)
- How to rotate credentials: [Tokens and credential rotation](./tokens.md)
- A pass over everything before going live: [Security checklist](./checklist.md)
