#!/usr/bin/env sh
# Replace {{PLACEHOLDER}} tokens in a scratch copy of templates/, or check placed files.
#
# Usage:
#   fill-placeholders.sh <values-file> <scratch-dir> [--milestone-0]
#       Fills every placeholder in place, then fails if any adoption placeholder is left.
#       --milestone-0 lets FIRST_CONTRACT_PATH wait until milestone 1.
#       values-file: KEY=value per line, # comments allowed. Keys match setup/ADOPT.md § 2.
#   fill-placeholders.sh --check <path>...
#       Reports leftover placeholders in files or folders already in your repository.
#       Edits nothing.
#
# COMPONENT_NAME is always allowed: the backfill workflow fills it at run time.
# node_modules and .git are always skipped. Portable: POSIX sh, sed, find and grep only.
set -eu

# Print "file:" and its unresolved placeholders for every file under the given paths.
report() {
  find "$@" \( -name node_modules -o -name .git \) -prune -o -type f -print |
    while IFS= read -r f; do
      matches=$(grep -oE '\{\{[A-Z_]+\}\}' "$f" 2>/dev/null || true)
      unresolved=$(printf '%s\n' "$matches" | grep -Ev "$allowed|^$" | sort -u || true)
      if [ -n "$unresolved" ]; then
        printf '%s\n%s\n' "$f:" "$unresolved"
      fi
    done
}

if [ "${1:-}" = '--check' ]; then
  shift
  [ "$#" -ge 1 ] || { echo "usage: fill-placeholders.sh --check <path>..." >&2; exit 2; }
  for p in "$@"; do
    [ -e "$p" ] || { echo "no such file or directory: $p" >&2; exit 2; }
  done
  allowed='^\{\{COMPONENT_NAME\}\}$'
  left=$(report "$@")
  if [ -n "$left" ]; then
    echo "Placeholders remain in:" >&2
    printf '%s\n' "$left" >&2
    exit 1
  fi
  echo "checked: no adoption placeholders remain"
  exit 0
fi

values="${1:?values file}"
target="${2:?scratch directory}"
case "${3:-}" in
  '') allowed='^\{\{COMPONENT_NAME\}\}$' ;;
  --milestone-0) allowed='^\{\{(COMPONENT_NAME|FIRST_CONTRACT_PATH)\}\}$' ;;
  *) echo "unknown option: $3" >&2; exit 2 ;;
esac
[ "$#" -le 3 ] || { echo "too many arguments" >&2; exit 2; }
[ -f "$values" ] || { echo "no such values file: $values" >&2; exit 2; }
[ -d "$target" ] || { echo "no such directory: $target" >&2; exit 2; }

# Build one sed script from the values file. Values may contain /, & and |, so escape them.
script=$(mktemp)
trap 'rm -f "$script"' EXIT
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|'#'*) continue ;; esac
  key=${line%%=*}
  val=${line#*=}
  esc=$(printf '%s' "$val" | sed -e 's/[\/&|]/\\&/g')
  printf 's|{{%s}}|%s|g\n' "$key" "$esc" >> "$script"
done < "$values"

find "$target" \( -name node_modules -o -name .git \) -prune -o -type f \( -name '*.md' -o -name '*.json' -o -name '*.yml' -o -name '*.yaml' -o -name '*.js' -o -name '*.ts' -o -name '*.sh' -o -name '.prettierignore' -o -name CODEOWNERS \) -print |
  while IFS= read -r f; do
    sed -i.bak -f "$script" "$f" && rm -f "$f.bak"
  done

left=$(report "$target")
if [ -n "$left" ]; then
  echo "Unfilled placeholders remain in:" >&2
  printf '%s\n' "$left" >&2
  exit 1
fi
if [ "${3:-}" = '--milestone-0' ]; then
  echo "filled: nothing left except FIRST_CONTRACT_PATH, which waits until milestone 1"
else
  echo "filled: no adoption placeholders remain"
fi
