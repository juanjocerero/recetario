#!/usr/bin/env node
import { readFileSync } from 'fs';
import { spawn } from 'child_process';

const cfg = JSON.parse(readFileSync('./deploy.config.json', 'utf8'));
const { host, remotePath, localPath } = cfg;

console.log('📦 Subiendo…');
const rsync = spawn(
  'rsync',
  ['-avz', '--progress', `${localPath}/`, `${host}:${remotePath}`],
  { stdio: 'inherit' }
);

rsync.on('close', code => {
  if (code === 0) {
    console.log('✅ Subida terminada');
  } else {
    console.error('❌ Error al sincronizar');
  }
});