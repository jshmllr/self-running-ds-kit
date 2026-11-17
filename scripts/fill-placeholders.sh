#!/usr/bin/env sh
# Replace {{PLACEHOLDER}} tokens in every file under a directory, in place.
#
# Usage: fill-placeholders.sh <values-file> <target-dir>
#   values-file: KEY=value per line, # comments allowed. Keys match setup/ADOPT.md § 2.
#   target-dir:  a COPY of templates/ (the script edits files in place).
#
# Exits 1 and lists the files if any {{...}} remains, so an unfilled placeholder never
# reaches a commit. {{COMPONENT_NAME}} is filled at run time by the backfill workflow,
# so it is allowed to remain. Portable: POSIX sh, sed and grep only.
set -eu

values="${1:?values file}"
target="${2:?target directory}"
[ -f "$values" ] || { echo "no such values file: $values" >&2; exit 2; }
[ -d "$target" ] || { echo "no such directory: $target" >&2; exit 2; }

# Build one sed script from the values file. Values may contain / and &, so escape them.
script=$(mktemp)
trap 'rm -f "$script"' EXIT
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|'#'*) continue ;; esac
  key=${line%%=*}
  val=${line#*=}
  esc=$(printf '%s' "$val" | sed -e 's/[\/&|]/\\&/g')
  printf 's|{{%s}}|%s|g\n' "$key" "$esc" >> "$script"
done < "$values"

find "$target" -type f \( -name '*.md' -o -name '*.json' -o -name '*.yml' -o -name '*.yaml' -o -name '*.js' -o -name '*.ts' -o -name '*.sh' -o -name '.prettierignore' \) | while IFS= read -r f; do
  sed -i.bak -f "$script" "$f" && rm -f "$f.bak"
done

left=$(grep -rl '{{[A-Z_]*}}' "$target" | xargs grep -l -E '\{\{[A-Z_]+\}\}' 2>/dev/null | while IFS= read -r f; do grep -oE '\{\{[A-Z_]+\}\}' "$f" | grep -qv '{{COMPONENT_NAME}}' && echo "$f"; done || true)
if [ -n "$left" ]; then
  echo "Unfilled placeholders remain in:" >&2
  echo "$left" >&2
  grep -rhoE '\{\{[A-Z_]+\}\}' "$target" | grep -v '{{COMPONENT_NAME}}' | sort -u >&2
  exit 1
fi
echo "filled: no placeholders remain under $target"
