// Генерирует dev-JWT для локального теста без реального auth-флоу.
//   node scripts/make-token.mjs "Ada Lovelace"
// Скопируйте вывод в localStorage.talkly.token в браузере.
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const secret = process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me';
const name = process.argv[2] ?? 'Test User';
const sub = process.argv[3] ?? randomUUID();

const token = jwt.sign({ sub, name }, secret, { expiresIn: '7d' });
console.log('\nUser:', name, '(id:', sub + ')');
console.log('\nlocalStorage.setItem("talkly.token", "' + token + '")\n');
