#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DEVICE_IP:-}" ]]; then
  echo 'Set DEVICE_IP to the phone IP address (or IP:port for wireless debugging).' >&2
  exit 1
fi

for tool in adb pnpm; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Required command not found: $tool" >&2
    exit 1
  fi
done

# DEVICE_IP may include the connection port shown by Android wireless debugging.
device_address="$DEVICE_IP"
if [[ "$device_address" != *:* ]]; then
  device_address="${device_address}:5555"
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

adb connect "$device_address"
if [[ "$(adb -s "$device_address" get-state)" != 'device' ]]; then
  echo "Device $device_address is not ready. Enable and authorize ADB debugging first." >&2
  exit 1
fi

pnpm build:shared
pnpm build:mobile:apk

apk_path="$repo_root/apps/mobile/android/app/build/outputs/apk/release/app-release.apk"
if [[ ! -f "$apk_path" ]]; then
  echo "Release APK not found: $apk_path" >&2
  exit 1
fi

adb -s "$device_address" install -r "$apk_path"
echo "Release installed on $device_address"
