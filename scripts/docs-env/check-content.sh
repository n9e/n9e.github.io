#!/usr/bin/env bash
# 正文的机械检查。check-parity.mjs 管中英一致，这个管「不该出现的东西」。
# 每批写完、人工审阅之前先跑这个，把能自动发现的问题挑干净。
set -uo pipefail
cd "$(dirname "$0")/../.."
bad=0

say() { echo; echo "== $1"; }

# 正文里引用的是 <Shot src="/img/docs/xxx" />（不带扩展名），
# 组件自己拼 .png 和 .dark.png，所以两份都要在
say "引用了但磁盘上没有的图"
grep -rhoE 'src="/img/docs/[^"]+"' docs i18n 2>/dev/null | sed 's|src="||; s|"$||' | sort -u | while read -r p; do
  for v in "" ".dark"; do
    [ -f "static${p}${v}.png" ] || echo "  缺图 static${p}${v}.png"
  done
done | tee /tmp/_missing_img
[ -s /tmp/_missing_img ] && bad=1

say "有图但没人引用"
find static/img/docs -name '*.png' 2>/dev/null | sed 's|^static||; s|\.dark\.png$||; s|\.png$||' | sort -u | while read -r p; do
  grep -rqF "src=\"$p\"" docs i18n 2>/dev/null || echo "  没人引用 $p"
done

# 文档里用 10.0.0.x / 192.168.x 这类 RFC 1918 地址举例是**对的**——
# 示例不该用真实的公网地址。所以这里不查网段，只查「这套工作流里真实用到的机器」：
# 地址从环境变量来，仓库里不留任何具体地址。
#
#   export DOCS_FORBIDDEN_HOSTS="1.2.3.4 5.6.7.8 some-host"
#
# 另外固定查开发服务器的端口——那个不该出现在成品文档里。
say "开发/实验环境地址泄漏"
pattern='localhost:8765'
for h in ${DOCS_FORBIDDEN_HOSTS:-}; do
  pattern="$pattern|$(printf '%s' "$h" | sed 's/\./\\./g')"
done
if grep -rnE "$pattern" docs i18n 2>/dev/null; then bad=1; fi

say "商业版功能出现在开源文档里"
if grep -rnE '/collects|/system/audits|/label-mappings|/global-muting-rules|/pingmesh|/reports\b|/mobile-device|/dial-analysis|/network-devices' docs i18n 2>/dev/null; then bad=1; fi

# 只在 data/ 和 alerting/ 下查：migration/from-zabbix 是「从 Zabbix 迁过来」的页面，
# 提到 Zabbix 是应该的，不是把它当数据源
say "把开源版没有的数据源当成能接入的（旧站残留）"
if grep -rniE '阿里云 ?SLS|腾讯云 ?CLS|Aliyun SLS|Tencent CLS|Jaeger|Zabbix' \
     docs/data docs/alerting docs/query \
     i18n/zh-Hans/docusaurus-plugin-content-docs/current/{data,alerting,query} 2>/dev/null; then bad=1; fi

say "还指向旧文档站的链接"
if grep -rn 'flashcat.cloud/docs' docs i18n 2>/dev/null | grep -v 'legacy:'; then bad=1; fi

# reference/ 下是查表用的长表格，而且大半是脚本生成的，不适用这条
say "超长页面（>250 行，通常是啰嗦了；reference/ 除外）"
find docs i18n \( -name '*.md' -o -name '*.mdx' \) ! -path '*/reference/*' \
  | xargs wc -l 2>/dev/null | awk '$1>250 && $2!="total" {print "  " $1 " " $2}'

echo
[ "$bad" = 0 ] && echo "机械检查通过 ✓" || echo "有问题，见上"
exit "$bad"
