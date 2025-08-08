#!/usr/bin/env node
import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises'; // Importamos writeFile
import { spawn } from 'child_process';
import { exit } from 'process';

// Leer configuración
const cfg = JSON.parse(readFileSync('./deploy.config.json', 'utf8'));
const { host, remotePath, localPath, buildPath, sshUser, pm2AppName, pm2Script, port, exclude } = cfg;

// NUEVA FUNCIÓN para generar el fichero de PM2
// deploy.js

// ... otras importaciones ...

// NUEVA FUNCIÓN para generar el fichero de PM2 (VERSIÓN FINAL Y ROBUSTA)
async function generateEcosystemFile() {
  console.log('📝 Generando fichero ecosystem.config.cjs...');
  
  // Este contenido se escribirá directamente en el fichero.
  // Es un script de Node que primero carga .env y luego exporta la configuración.
  const fileContent = `
// Carga las variables del fichero .env en el entorno de ESTE MISMO SCRIPT
require('dotenv').config({ path: '${remotePath}/.env' });
  
module.exports = {
  apps: [{
    name: '${pm2AppName}',
    script: '${pm2Script}',
    cwd: '${remotePath}',
    // El bloque 'env' define qué variables se pasarán al proceso hijo (tu app)
    env: {
      NODE_ENV: 'production',
      PORT: ${port},
      // Leemos las variables que dotenv cargó en process.env y se las pasamos a la app
      DATABASE_URL: process.env.DATABASE_URL,
      SESSION_SECRET: process.env.SESSION_SECRET
    }
  }]
};
`;
  
  // Escribimos el fichero localmente. Será subido por rsync.
  await writeFile('ecosystem.config.cjs', fileContent.trim(), 'utf8');
  console.log('✅ Fichero ecosystem.config.cjs generado.');
}

// ... El resto de tu script deploy.js no necesita cambios ...

function runRemoteCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`🖥️  Ejecutando en servidor: ${command}`);
    const commandWithNvm = `source ~/.nvm/nvm.sh && ${command}`;
    const sshArgs = [
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'StrictHostKeyChecking=no',
      `${sshUser}@${host}`,
      commandWithNvm
    ];
    
    const ssh = spawn('ssh', sshArgs, { stdio: 'inherit' });
    
    ssh.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando remoto falló con código ${code}: ${command}`));
      }
    });
  });
}

// Función principal de despliegue (actualizada con el nuevo paso)
async function deploy() {
  try {
    console.log('🚀 Iniciando proceso de despliegue...\n');
    
    // 1. Compilar localmente
    console.log('📦 Paso 1/8: Compilando aplicación localmente...');
    await runCommand('npm', ['run', 'build']);
    console.log('✅ Compilación local completada\n');
    
    // 2. NUEVO PASO: Generar fichero de configuración de PM2
    console.log('📦 Paso 2/8: Generando fichero de configuración de PM2...');
    await generateEcosystemFile();
    console.log('✅ Configuración de PM2 generada\n');
    
    // 3. Subir el repositorio completo (ahora incluye ecosystem.config.cjs)
    console.log('📦 Paso 3/8: Subiendo repositorio al servidor...');
    const excludeArgs = exclude.map(item => `--exclude=${item}`);
    await runCommand('rsync', [
      '-avz', '--progress', '--delete',
      ...excludeArgs,
      `${localPath}/`,
      `${sshUser}@${host}:${remotePath}`
    ]);
    console.log('✅ Repositorio sincronizado\n');
    
    // 4. Subir la carpeta build compilada localmente
    console.log('📦 Paso 4/8: Subiendo archivos compilados...');
    await runCommand('rsync', [
      '-avz', '--progress', '--delete',
      `${buildPath}/`,
      `${sshUser}@${host}:${remotePath}/${buildPath}`
    ]);
    console.log('✅ Archivos compilados subidos\n');
    
    // 5. Instalar dependencias en el servidor
    console.log('📦 Paso 5/8: Instalando dependencias en el servidor...');
    await runRemoteCommand(`cd ${remotePath} && npm ci`);
    console.log('✅ Dependencias instaladas\n');
    
    // 6. Generar cliente Prisma
    console.log('🗄️  Paso 6/8: Generando cliente Prisma...');
    await runRemoteCommand(`cd ${remotePath} && npx prisma generate`);
    console.log('✅ Cliente Prisma generado\n');
    
    // 7. Aplicar migraciones de Prisma
    console.log('🔄 Paso 7/8: Aplicando migraciones...');
    await runRemoteCommand(`cd ${remotePath} && npx prisma migrate deploy`);
    console.log('✅ Migraciones aplicadas\n');
    
    // 8. Reiniciar aplicación con PM2
    console.log('🔄 Paso 8/8: Reiniciando aplicación...');
    // Ahora usamos el fichero generado en lugar de solo el nombre
    await runRemoteCommand(`cd ${remotePath} && pm2 startOrReload ecosystem.config.cjs`);
    console.log('✅ Aplicación reiniciada\n');
    
    console.log('🎉 ¡Despliegue completado con éxito!');
  } catch (error) {
    console.error('\n❌ Error durante el despliegue:', error.message);
    console.error('\n💡 Revisa los pasos anteriores para identificar el problema');
    exit(1);
  }
}

// Ejecutar despliegue
deploy();