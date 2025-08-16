#!/usr/bin/env node
import { createHash } from 'crypto';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';

const hashFile = '.npm-hash-cache';

function getHash() {
  const pkg = readFileSync('package.json', 'utf8');
  const lock = existsSync('package-lock.json') ? readFileSync('package-lock.json', 'utf8') : '';
  return createHash('sha256').update(pkg + lock).digest('hex');
}

function hasDependenciesChanged() {
  if (!existsSync(hashFile)) return true;
  const oldHash = readFileSync(hashFile, 'utf8').trim();
  return getHash() !== oldHash;
}

function saveHash() {
  writeFileSync(hashFile, getHash());
}

async function runOriginalDeploy() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['deploy.js'], { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`deploy.js falló con código ${code}`));
    });
  });
}

(async () => {
  const changed = hasDependenciesChanged();
  if (changed) {
    console.log('📦 Detectados cambios en dependencias. Ejecutando npm ci...');
    process.env.SKIP_NPM_CI = 'false';
  } else {
    console.log('✅ Sin cambios en dependencias. Saltando npm ci.');
    process.env.SKIP_NPM_CI = 'true';
  }

  await runOriginalDeploy();

  if (changed) {
    saveHash();
    console.log('💾 Hash de dependencias actualizado.');
  }
})();