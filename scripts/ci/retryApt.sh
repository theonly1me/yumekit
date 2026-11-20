#!/usr/bin/env bash
set -euo pipefail

attempts="$1"
seconds="$2"
shift 2

for attempt in $(seq 1 "$attempts"); do
  if timeout --kill-after=10s "${seconds}s" "$@"; then
    exit 0
  fi
  echo "Attempt ${attempt} of ${attempts} failed or timed out after ${seconds} seconds: $*" >&2
  sudo dpkg --configure -a || true
  sleep 5
done

echo "All ${attempts} attempts failed: $*" >&2
exit 1
