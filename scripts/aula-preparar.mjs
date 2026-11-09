import { existsSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const falhas = [];
const tempDir = mkdtempSync(join(tmpdir(), 'zelopets-aula-'));
const environmentPath = join(tempDir, 'environment.json');
const reportPath = join(tempDir, 'newman-report.json');
const environment = JSON.parse(readFileSync('postman/ZeloPets.postman_environment.json', 'utf8'));
const adminVariable = environment.values.find((variable) => variable.key === 'adminPassword');
if (!adminVariable) throw new Error('Variável adminPassword ausente do ambiente Postman');
const adminPassword = process.env.ADMIN_DEMO_PASSWORD || adminVariable.value;
let newmanReportExists = false;

function executar(nome, args, env = process.env) {
  const resultado = spawnSync(pnpm, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env,
  });
  if (resultado.error || resultado.status !== 0) falhas.push(nome);
  return resultado.status === 0;
}

function imprimirResumoPorPasta(relatorio) {
  const pastasPorId = new Map();
  const pastasPorNome = new Map();
  const percorrer = (itens, pastaAtual) => {
    for (const item of itens) {
      if (item.item) {
        percorrer(item.item, item.name);
      } else {
        pastasPorId.set(item.id, pastaAtual);
        pastasPorNome.set(item.name, pastaAtual);
      }
    }
  };
  const colecao = JSON.parse(readFileSync('postman/ZeloPets.postman_collection.json', 'utf8'));
  percorrer(colecao.item, '');

  const resultados = new Map();
  for (const execucao of relatorio.run.executions ?? []) {
    const nomePasta =
      pastasPorId.get(execucao.item?.id) ??
      pastasPorNome.get(execucao.item?.name) ??
      'Pasta não identificada';
    const atual = resultados.get(nomePasta) ?? { requisicoes: 0, falhas: 0 };
    atual.requisicoes += 1;
    atual.falhas += (execucao.assertions ?? []).filter((assertion) => assertion.error).length;
    resultados.set(nomePasta, atual);
  }

  console.log('Resultado Newman por pasta:');
  for (const [nome, resultado] of resultados) {
    console.log(`- ${nome}: ${resultado.requisicoes} requisições, ${resultado.falhas} falhas`);
  }
}

try {
  if (executar('verificar', ['verificar'])) {
    if (executar('seed de demonstração', ['prisma', 'db', 'seed'], {
      ...process.env,
      ADMIN_DEMO_PASSWORD: adminPassword,
    })) {
      adminVariable.value = adminPassword;
      writeFileSync(environmentPath, JSON.stringify(environment), 'utf8');

      newmanReportExists = executar('Newman', [
        'dlx',
        'newman',
        'run',
        'postman/ZeloPets.postman_collection.json',
        '-e',
        environmentPath,
        '--reporters',
        'cli,json',
        '--reporter-json-export',
        reportPath,
      ]);
      if (existsSync(reportPath)) {
        imprimirResumoPorPasta(JSON.parse(readFileSync(reportPath, 'utf8')));
      } else if (newmanReportExists) {
        throw new Error('Newman terminou sem gerar o relatório JSON');
      }
    }
  }
} finally {
  try {
    unlinkSync(environmentPath);
  } catch (erro) {
    if (erro.code !== 'ENOENT') throw erro;
  }
  try {
    unlinkSync(reportPath);
  } catch (erro) {
    if (erro.code !== 'ENOENT') throw erro;
  }
  rmdirSync(tempDir);
}

if (falhas.length > 0) {
  console.error(`FALHAS: ${falhas.join(', ')}`);
  process.exitCode = 1;
} else if (newmanReportExists) {
  console.log('PRONTO PARA A AULA');
}
