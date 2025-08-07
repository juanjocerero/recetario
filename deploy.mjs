#!/usr/bin/env node
import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import { exit } from 'process';

// Leer configuración
const cfg = JSON.parse(readFileSync('./deploy.config.json', 'utf8'));
const { host, remotePath, localPath, buildPath, sshUser, pm2AppName, exclude } = cfg;

// Función para ejecutar comandos locales con mejor manejo de errores
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🔨 Ejecutando: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { stdio: 'inherit' });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falló con código ${code}: ${command} ${args.join(' ')}`));
      }
    });
  });
}

// Función para ejecutar comandos remotos vía SSH
function runRemoteCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`🖥️  Ejecutando en servidor: ${command}`);
    
    // Usamos la configuración de SSH si existe
    const sshArgs = [
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'StrictHostKeyChecking=no',
      `${sshUser}@${host}`,
      'zsh', '-ic', command          // <-- carga tu entorno zsh
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

// Función principal de despliegue
async function deploy() {
  try {
    console.log('🚀 Iniciando proceso de despliegue...\n');
    
    // 1. Compilar localmente (por falta de memoria en VPS)
    console.log('📦 Paso 1/7: Compilando aplicación localmente...');
    await runCommand('npm', ['run', 'build']);
    console.log('✅ Compilación local completada\n');
    
    // 2. Subir el repositorio completo (excluyendo archivos innecesarios)
    console.log('📦 Paso 2/7: Subiendo repositorio al servidor...');
    const excludeArgs = exclude.map(item => `--exclude=${item}`);
    await runCommand('rsync', [
      '-avz', '--progress', '--delete',
      ...excludeArgs,
      `${localPath}/`,
      `${sshUser}@${host}:${remotePath}`
    ]);
    console.log('✅ Repositorio sincronizado\n');
    
    // 3. Subir la carpeta build compilada localmente
    console.log('📦 Paso 3/7: Subiendo archivos compilados...');
    await runCommand('rsync', [
      '-avz', '--progress', '--delete',
      `${buildPath}/`,
      `${sshUser}@${host}:${remotePath}/${buildPath}`
    ]);
    console.log('✅ Archivos compilados subidos\n');
    
    // 4. Instalar dependencias en el servidor (usando sintaxis moderna)
    console.log('📦 Paso 4/7: Instalando dependencias en el servidor...');
    await runRemoteCommand(`cd ${remotePath} && npm ci --omit=dev`);
    console.log('✅ Dependencias instaladas\n');
    
    // 5. Generar cliente Prisma en el servidor
    console.log('🗄️  Paso 5/7: Generando cliente Prisma...');
    await runRemoteCommand(`cd ${remotePath} && npx prisma generate`);
    console.log('✅ Cliente Prisma generado\n');
    
    // 6. Aplicar migraciones de Prisma
    console.log('🔄 Paso 6/7: Aplicando migraciones...');
    await runRemoteCommand(`cd ${remotePath} && npx prisma migrate deploy`);
    console.log('✅ Migraciones aplicadas\n');
    
    // 7. Reiniciar aplicación con PM2
    console.log('🔄 Paso 7/7: Reiniciando aplicación...');
    await runRemoteCommand(`cd ${remotePath} && pm2 reload ${pm2AppName}`);
    console.log('✅ Aplicación reiniciada\n');
    
    console.log('🎉 ¡Despliegue completado con éxito!');
    console.log('🌐 Tu aplicación está disponible en: https://recetas.juanjocerero.es');
  } catch (error) {
    console.error('\n❌ Error durante el despliegue:', error.message);
    console.error('\n💡 Revisa los pasos anteriores para identificar el problema');
    exit(1);
  }
}

// Ejecutar despliegue
deploy();