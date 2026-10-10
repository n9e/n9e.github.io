#!/usr/bin/env python3
"""收夜莺通知的假 webhook。让「通知记录」页面能出现真正投递成功的记录。

    python3 scripts/docs-env/webhook-listener.py [port]

收到的每条消息追加写到 /tmp/n9e-docs-webhook.log，方便对照截图。
"""
import http.server
import json
import sys
import time

LOG = "/tmp/n9e-docs-webhook.log"


class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n).decode("utf-8", "replace")
        with open(LOG, "a") as f:
            f.write(f"--- {time.strftime('%F %T')} {self.path}\n{body}\n")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 18899
    print(f"listening on :{port}, writing to {LOG}", flush=True)
    http.server.HTTPServer(("0.0.0.0", port), Handler).serve_forever()
