// 社区版发布：收集 Windows / macOS 构件，用社区版公钥验签，写应用内更新用的 latest.json。
// 用法：node community-release.mjs <输出目录> <版本> <owner/repo> <minisign 路径>
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '../..');
const [output, version, repository, minisign] = process.argv.slice(2);
assert.match(version || '', /^\d+\.\d+\.\d+$/);
assert.match(repository || '', /^[\w.-]+\/[\w.-]+$/);
assert.equal(JSON.parse(readFileSync(`${root}/package.json`)).version, version);
const publicKey = Buffer.from(readFileSync(`${root}/src-tauri/community-updater.pub`, 'utf8').trim(), 'base64');
const notes = (process.env.RELEASE_NOTES || '').trim();
assert(notes.length >= 1 && notes.length <= 600, 'release notes must be 1-600 characters');
const release = `${output}/release`;
assert(!existsSync(release), 'Use a fresh output directory');
mkdirSync(release, { recursive: true });
const work = mkdtempSync(`${tmpdir()}/yeschoy-release-`);
writeFileSync(`${work}/key.pub`, publicKey);
const prefix = `yeschoy-${version}-community`;
const files = {
  windows: `${output}/windows/public/${prefix}-windows-x86_64-installer.exe`,
  app: `${output}/macos/public/${prefix}-macos-universal.app.tar.gz`,
  dmg: `${output}/macos/public/${prefix}-macos-universal-installer.dmg`,
};
const signatures = {};
const sums = [];
for (const [kind, path] of Object.entries(files)) {
  const signature = readFileSync(`${path}.sig`, 'utf8').trim();
  writeFileSync(`${work}/${kind}.minisig`, Buffer.from(signature, 'base64'));
  execFileSync(minisign, ['-Vm', path, '-x', `${work}/${kind}.minisig`, '-p', `${work}/key.pub`], { stdio: 'ignore' });
  signatures[kind] = signature;
  const name = path.split('/').pop();
  copyFileSync(path, `${release}/${name}`);
  copyFileSync(`${path}.sig`, `${release}/${name}.sig`);
  sums.push(`${createHash('sha256').update(readFileSync(path)).digest('hex')}  ${name}`);
}
const url = name => `https://github.com/${repository}/releases/download/v${version}/${name}`;
const mac = { url: url(`${prefix}-macos-universal.app.tar.gz`), signature: signatures.app };
const manifest = {
  schemaVersion: 2,
  variant: 'community',
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': { url: url(`${prefix}-windows-x86_64-installer.exe`), signature: signatures.windows },
    'darwin-x86_64': mac,
    'darwin-aarch64': mac,
  },
};
writeFileSync(`${release}/latest.json`, JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(`${release}/SHA256SUMS.txt`, sums.join('\n') + '\n');
console.log(JSON.stringify({ release, version, files: Object.keys(files).length, signaturesVerified: true }));
