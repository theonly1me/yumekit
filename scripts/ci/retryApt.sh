#!/usr/bin/env bash
set -euo pipefail

attempts="$1"
seconds="$2"
shift 2

wait_for_package_manager() {
  for _ in $(seq 1 "$seconds"); do
    if ! pgrep --exact apt-get > /dev/null && ! pgrep --exact dpkg > /dev/null; then
      return 0
    fi
    sleep 1
  done
  echo "An apt-get or dpkg still runs after ${seconds} seconds." >&2
}

for attempt in $(seq 1 "$attempts"); do
  if timeout --kill-after=10s "${seconds}s" "$@"; then
    exit 0
  fi
  echo "Attempt ${attempt} of ${attempts} failed or timed out after ${seconds} seconds: $*" >&2
  wait_for_package_manager
  sudo dpkg --configure -a || true
  sleep 5
done

echo "All ${attempts} attempts failed: $*" >&2
exit 1
