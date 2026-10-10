#!/usr/bin/env bash
# 起几个 categraf 实例，每个伪装成一台主机，让「机器列表」和主机仪表盘有真数据。
#
#   ./start-categraf.sh start|stop|status
#
# start 是幂等的（会先停一遍），但它不会自己退出到后台——起来的 categraf 进程
# 挂在调用它的 shell 下面。从自动化里调的话记得放后台，别等它返回。
#
# 注意：categraf 启动时会 os.Chdir 到自己二进制所在目录（main.go:55），
# 所以 --configs 必须给绝对路径，相对路径永远指向 categraf 仓库自带的 conf。
set -euo pipefail

CATEGRAF_BIN=${CATEGRAF_BIN:-/Users/ning/gopath/src/github.com/flashcatcloud/categraf/categraf}
CATEGRAF_SRC=$(dirname "$CATEGRAF_BIN")
N9E=${N9E_BASE:-http://127.0.0.1:17000}
WORK=${CATEGRAF_WORK:-/tmp/n9e-docs-categraf}

# 主机名 : env : region
HOSTS=(
  "n9e-web-01:prod:trade"
  "n9e-web-02:prod:trade"
  "n9e-db-01:prod:trade"
  "n9e-cache-01:prod:infra"
  "n9e-build-01:staging:infra"
)

# 只留这几个采集插件：mac 上能跑、指标够画主机大盘，其余全是 "not supported" 噪音
INPUTS=(input.cpu input.mem input.disk input.diskio input.net input.netstat input.system input.processes)

stop() {
  pkill -f "categraf --configs $WORK" || true
  echo "  stopped"
}

start() {
  # 先停一遍：重复 start 会让实例翻倍，而它们都在往同一个地址写，
  # 多出来的那批只是白烧 CPU
  stop >/dev/null 2>&1
  for spec in "${HOSTS[@]}"; do
    IFS=: read -r name env region <<< "$spec"
    d="$WORK/$name/conf"
    mkdir -p "$d"
    for p in "${INPUTS[@]}"; do
      [ -d "$d/$p" ] || cp -R "$CATEGRAF_SRC/conf/$p" "$d/"
    done
    sed -e "s|^hostname = \"\"|hostname = \"$name\"|" \
        -e "s|^url = \"http://[^\"]*/prometheus/v1/write\"|url = \"$N9E/prometheus/v1/write\"|" \
        -e "s|^url = \"http://[^\"]*/v1/n9e/heartbeat\"|url = \"$N9E/v1/n9e/heartbeat\"|" \
        -e "s|^# region = \"shanghai\"|region = \"$region\"|" \
        -e "s|^# env = \"localhost\"|env = \"$env\"|" \
        "$CATEGRAF_SRC/conf/config.toml" > "$d/config.toml"
    # NO_PROXY：本机的 http 代理会把 127.0.0.1 的请求也截走
    # stdin 也要断开：否则调用方的管道一直被子进程持有，脚本看起来"卡住"
    ( cd "$WORK/$name" && NO_PROXY='*' no_proxy='*' \
        nohup "$CATEGRAF_BIN" --configs "$d" < /dev/null > categraf.log 2>&1 &
      echo $! > "$WORK/$name/categraf.pid"
      disown 2>/dev/null || true )
    echo "  started $name (pid $(cat "$WORK/$name/categraf.pid"))"
  done
}


status() {
  ps -eo pid,command | grep "[c]ategraf --configs $WORK" | sed 's/--configs.*conf//' || echo "  none running"
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  restart) stop; sleep 1; start ;;
  status) status ;;
  *) echo "usage: $0 start|stop|restart|status" >&2; exit 1 ;;
esac
