#!/usr/bin/env node
import { createHash } from 'crypto';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { deploy } from './deploy.mjs';

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

(async () => {
  const changed = hasDependenciesChanged();
  if (changed) {
    console.log('📦 Detectados cambios en dependencias. Ejecutando npm ci...');
    process.env.SKIP_NPM_CI = 'false';
  } else {
    console.log('✅ Sin cambios en dependencias. Saltando npm ci.');
    process.env.SKIP_NPM_CI = 'true';
  }

  try {
    await deploy();
    if (changed) {
      saveHash();
      console.log('💾 Hash de dependencias actualizado.');
    }
  } catch (error) {
    // El script de deploy ya maneja sus propios errores, pero por si acaso.
    console.error('Error fatal en el proceso de despliegue inteligente.', error);
  }
})();
