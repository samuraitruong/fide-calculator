const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

function runDeployment(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), 'fide-deploy-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'bin'));
    const log = join(root, 'calls');
    copyFileSync(resolve(__dirname, '../deploy-mobile-release.sh'), join(root, 'scripts/deploy-mobile-release.sh'));
    writeFileSync(join(root, 'bin/adb'), `#!/bin/bash\nprintf 'adb %s\\n' "$*" >> "$CALL_LOG"\nif [[ "$*" == *get-state ]]; then echo "\${DEVICE_STATE:-device}"; fi\n`, { mode: 0o755 });
    writeFileSync(join(root, 'bin/pnpm'), `#!/bin/bash\nprintf 'pnpm %s\\n' "$*" >> "$CALL_LOG"\nif [[ "$*" == build:mobile:apk ]]; then\n  if [[ "\${BUILD_FAIL:-0}" == 1 ]]; then exit 1; fi\n  mkdir -p apps/mobile/android/app/build/outputs/apk/release\n  touch apps/mobile/android/app/build/outputs/apk/release/app-release.apk\nfi\n`, { mode: 0o755 });
    const result = spawnSync('bash', [join(root, 'scripts/deploy-mobile-release.sh')], {
      cwd: tmpdir(), encoding: 'utf8',
      env: { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`, CALL_LOG: log, DEVICE_IP: '192.168.1.40', ...overrides },
    });
    let calls = '';
    try { calls = readFileSync(log, 'utf8'); } catch {}
    return { ...result, calls };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('requires DEVICE_IP before building or connecting', () => {
  const result = runDeployment({ DEVICE_IP: '' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DEVICE_IP/);
  assert.equal(result.calls, '');
});

test('builds and installs the release on the specified device from any working directory', () => {
  const result = runDeployment();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.calls, /adb connect 192\.168\.1\.40:5555/);
  assert.match(result.calls, /pnpm build:shared\npnpm build:mobile:apk/);
  assert.match(result.calls, /adb -s 192\.168\.1\.40:5555 install -r .*app-release\.apk/);
});

test('accepts a wireless debugging port in DEVICE_IP', () => {
  const result = runDeployment({ DEVICE_IP: '192.168.1.40:37123' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.calls, /adb -s 192\.168\.1\.40:37123 install -r/);
});

test('does not build or install when the device is offline', () => {
  const result = runDeployment({ DEVICE_STATE: 'offline' });
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.calls, /pnpm|install/);
});

test('does not install an APK after a failed build', () => {
  const result = runDeployment({ BUILD_FAIL: '1' });
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.calls, /install/);
});
