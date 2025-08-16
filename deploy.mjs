#!/usr/bin/env node
import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { spawn } from 'child_process';
import { exit } from 'process';

// Leer configuración
const cfg = JSON.parse(readFileSync('./deploy.config.json', 'utf8'));
const { host, remotePath, localPath, buildPath, sshUser, pm2AppName, pm2Script, port, exclude } = cfg;

// ---- FUNCIONES DE UTILIDAD ----
// Función para ejecutar comandos locales
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
    const commandWithNvm = `bash -c 'export SHELL=/bin/bash && source ~/.nvm/nvm.sh --no-use && ${command}'`;
    const sshArgs = [
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'LogLevel=ERROR',
    ];
    
    // Añadir la clave SSH si está especificada
    if (cfg.sshKey) {
      sshArgs.push('-i', cfg.sshKey);
    }
    
    sshArgs.push(`${sshUser}@${host}`, commandWithNvm);
    
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

// Función para generar el fichero de configuración de PM2
async function generateEcosystemFile() {
  console.log('📝 Generando fichero ecosystem.config.cjs...');
  
  const fileContent = `
// Carga las variables del fichero .env en el entorno de ESTE MISMO SCRIPT
require('dotenv').config({ path: '${remotePath}/.env' });
  
module.exports = {
  apps: [{
    name: '${pm2AppName}',
    script: '${pm2Script}',
    cwd: '${remotePath}',
    env: {
      NODE_ENV: 'production',
      PORT: ${port},
      DATABASE_URL: process.env.DATABASE_URL,
      SESSION_SECRET: process.env.SESSION_SECRET,
      ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    }
  }]
};
`;
  
  await writeFile('ecosystem.config.cjs', fileContent.trim(), 'utf8');
  console.log('✅ Fichero ecosystem.config.cjs generado.');
}

// Al inicio de tu script, antes de deploy()
async function ensureSshKeyLoaded() {
  try {
    await runCommand('ssh-add', ['-l']);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.log('🔑 Clave SSH no encontrada en el agente. Intentando añadir...');
    try {
      await runCommand('ssh-add', [cfg.sshKey]);
    } catch (error) {
      console.error('❌ No se pudo añadir la clave SSH al agente. Añádela manualmente:');
      console.error(`ssh-add ${cfg.sshKey}`);
      throw error;
    }
  }
}

// ---- FUNCIÓN PRINCIPAL DE DESPLIEGUE ----
async function deploy() {
  try {
    console.log('🚀 Iniciando proceso de despliegue...\n');
    
    // Verificar clave SSH
    await ensureSshKeyLoaded();
    
    // Paso 1: Compilar localmente
    console.log('📦 Paso 1/9: Compilando aplicación localmente...');
    await runCommand('npm', ['run', 'build']);
    console.log('✅ Compilación local completada\n');
    
    // Paso 2: Generar fichero de configuración de PM2
    console.log('📦 Paso 2/9: Generando fichero de configuración de PM2...');
    await generateEcosystemFile();
    console.log('✅ Configuración de PM2 generada\n');
    
    // Paso 3: Subir el repositorio completo
    console.log('📦 Paso 3/9: Subiendo repositorio al servidor...');
    const excludeArgs = exclude.map(item => `--exclude=${item}`);
    const sshCommand = `ssh -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o StrictHostKeyChecking=no -i ${cfg.sshKey}`;
    await runCommand('rsync', [
      '-azq', '--no-motd', '--delete',  // CAMBIADO AQUÍ
      '-e', sshCommand,
      ...excludeArgs,
      `${localPath}/`,
      `${sshUser}@${host}:${remotePath}`
    ]);
    console.log('✅ Repositorio sincronizado\n');
    
    // Paso 4: Subir la carpeta build
    console.log('📦 Paso 4/9: Subiendo archivos compilados...');
    await runCommand('rsync', [
      '-azq', '--no-motd', '--delete',  // CAMBIADO AQUÍ
      '-e', sshCommand,
      `${buildPath}/`,
      `${sshUser}@${host}:${remotePath}/${buildPath}`
    ]);
    console.log('✅ Archivos compilados subidos\n');
    
    // Paso 5: Instalar dependencias en el servidor
    console.log('📦 Paso 5/9: Instalando dependencias en el servidor...');
    // await runRemoteCommand(`cd ${remotePath} && npm ci`);
    if (process.env.SKIP_NPM_CI !== 'true') {
      console.log('📦 Instalando dependencias en el servidor...');
      await runRemoteCommand(`cd ${remotePath} && npm ci`);
    } else {
      console.log('⏭️  Saltando instalación de dependencias (sin cambios)');
    }
    console.log('✅ Dependencias instaladas\n');
    
    // Paso 6: Generar cliente Prisma
    console.log('🗄️  Paso 6/9: Generando cliente Prisma...');
    await runRemoteCommand(`cd ${remotePath} && npx prisma generate`);
    console.log('✅ Cliente Prisma generado\n');
    
    // Paso 7: Aplicar migraciones de Prisma
    console.log('🔄 Paso 7/9: Aplicando migraciones...');
    await runRemoteCommand(`cd ${remotePath} && npx prisma migrate deploy`);
    console.log('✅ Migraciones aplicadas\n');
    
    // Paso 8: Crear usuario administrador (si no existe)
    console.log('👤 Paso 8/9: Creando usuario administrador...');
    // Leemos la contraseña del admin desde el .env del servidor y la pasamos al script
    await runRemoteCommand(
      `cd ${remotePath} && export $(grep -v '^#' .env | xargs) && npx tsx scripts/create-admin.ts`
    );
    console.log('✅ Proceso de creación de administrador finalizado\n');
    
    // Paso 9: Reiniciar aplicación con PM2
    console.log('🔄 Paso 9/9: Reiniciando aplicación...');
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