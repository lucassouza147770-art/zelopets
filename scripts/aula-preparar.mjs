import { spawnSync } from 'node:child_process';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const falhas = [];

function executar(nome, args) {
  const resultado = spawnSync(pnpm, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (resultado.error || resultado.status !== 0) falhas.push(nome);
}

executar('verificar', ['verificar']);
if (falhas.length === 0) {
  executar('seed de demonstração', ['prisma', 'db', 'seed']);
}
if (falhas.length === 0) {
  executar('Newman', ['dlx', 'newman', 'run', 'postman/ZeloPets.postman_collection.json', '-e', 'postman/ZeloPets.postman_environment.json']);
}

if (falhas.length > 0) {
  console.error(`FALHAS: ${falhas.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('PRONTO PARA A AULA');
}
