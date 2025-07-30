// Ruta: scripts/hash-password.js
// Uso: node scripts/hash-password.js 'tu_contraseña_aqui'

import { hash } from 'bcryptjs';

const password = process.argv[2];

if (!password) {
	console.error('Por favor, proporciona una contraseña como argumento.');
	process.exit(1);
}

const SALT_ROUNDS = 10;

hash(password, SALT_ROUNDS).then((hash) => {
	console.log('Contraseña:', password);
	console.log('Hash:', hash);
	console.log('\nCopia este hash en tu fichero .env como ADMIN_PASSWORD_HASH');
});
