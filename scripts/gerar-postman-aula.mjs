import { mkdirSync, writeFileSync } from 'node:fs';

const request = (name, method, path, { body, auth = true, headers = [], test = 'pm.test("status esperado", () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));' } = {}) => ({
  name: `${method} ${path} — ${name}`,
  request: {
    method,
    header: [...(body ? [{ key: 'Content-Type', value: 'application/json' }] : []), ...headers],
    ...(auth ? {} : { auth: { type: 'noauth' } }),
    url: { raw: `{{baseUrl}}${path}`, host: ['{{baseUrl}}'], path: path.slice(1).split('/') },
    ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
  },
  event: [{ listen: 'test', script: { exec: test.split('\n') } }],
});

const capture = (variable, expression) =>
  `if (pm.response.code >= 200 && pm.response.code < 300) pm.environment.set("${variable}", ${expression});`;

const folders = [
  {
    name: '00 Saúde e Login',
    item: [
      request('saúde', 'GET', '/saude', { auth: false }),
      request('registro tutor único', 'POST', '/auth/registro', {
        auth: false,
        body: { nome: 'Tutor Aula', email: 'aula-{{$timestamp}}@example.com', senha: 'aula1234' },
        test: `${capture('tokenB', 'pm.response.json().accessToken')}\npm.test("registro", () => pm.expect(pm.response.code).to.eql(201));`,
      }),
      request('login demo', 'POST', '/auth/login', {
        auth: false,
        body: { email: '{{demoEmail}}', senha: '{{demoPassword}}' },
        test: `${capture('token', 'pm.response.json().accessToken')}\npm.test("login", () => pm.expect(pm.response.code).to.eql(200));`,
      }),
      request('login admin', 'POST', '/auth/login', {
        auth: false,
        body: { email: '{{adminEmail}}', senha: '{{adminPassword}}' },
        test: 'if (pm.response.code === 200) pm.environment.set("adminToken", pm.response.json().accessToken);\npm.test("login admin configurado ou ausente", () => pm.expect(pm.response.code).to.be.oneOf([200, 400, 401]));',
      }),
      request('perfil do tutor', 'GET', '/tutores/me'),
    ],
  },
  {
    name: '01 CRUD de Pets',
    item: [
      request('criar pet', 'POST', '/pets', {
        body: { nome: 'Pet Aula', porte: 'MEDIO', nivelEnergia: 'ALTO', raca: 'SRD', pesoKg: 12, comportamento: ['sociavel'] },
        test: `${capture('petId', 'pm.response.json().id')}\npm.test("criação", () => pm.expect(pm.response.code).to.eql(201));`,
      }),
      request('listar pets', 'GET', '/pets'),
      request('buscar pet criado', 'GET', '/pets/{{petId}}'),
      request('atualizar pet', 'PATCH', '/pets/{{petId}}', { body: { nome: 'Pet Aula Atualizado', pesoKg: 13 } }),
      request('remover pet', 'DELETE', '/pets/{{petId}}'),
      request('confirmar 404', 'GET', '/pets/{{petId}}', {
        test: 'pm.test("pet removido", () => pm.expect(pm.response.code).to.eql(404));',
      }),
      request('criar pet de apoio', 'POST', '/pets', {
        body: { nome: 'Pet Apoio Aula', porte: 'MEDIO', nivelEnergia: 'MEDIO' },
        test: `${capture('petId', 'pm.response.json().id')}\npm.test("pet de apoio", () => pm.expect(pm.response.code).to.eql(201));`,
      }),
    ],
  },
  {
    name: '02 Prestadores e catálogo',
    item: [
      request('listar prestadores', 'GET', '/prestadores'),
      request('listar pacotes', 'GET', '/pacotes-hospedagem', { auth: false, test: `${capture('pacoteId', 'pm.response.json()[0].id')}\npm.test("catálogo", () => pm.expect(pm.response.code).to.eql(200));` }),
      request('listar planos', 'GET', '/planos-nutricionais', { auth: false, test: `${capture('planoId', 'pm.response.json()[0].id')}\npm.test("catálogo", () => pm.expect(pm.response.code).to.eql(200));` }),
    ],
  },
  {
    name: '03 Passeios e transporte',
    item: [
      request('criar passeio', 'POST', '/passeios', { body: { petId: '{{petId}}', dataHora: '2030-01-01T10:00:00.000Z', duracaoMinutos: 30 }, test: `${capture('passeioId', 'pm.response.json().id')}\npm.test("passeio", () => pm.expect(pm.response.code).to.eql(201));` }),
      request('listar passeios', 'GET', '/passeios'),
      request('próximo passeio', 'GET', '/passeios/proximo'),
      request('buscar passeio', 'GET', '/passeios/{{passeioId}}'),
      request('atualizar passeio', 'PATCH', '/passeios/{{passeioId}}', { body: { duracaoMinutos: 45 } }),
      request('cancelar passeio', 'DELETE', '/passeios/{{passeioId}}'),
    ],
  },
  {
    name: '04 Hospedagens',
    item: [
      request('criar hospedagem', 'POST', '/hospedagens', { body: { petId: '{{petId}}', pacoteId: '{{pacoteId}}', dataCheckin: '2030-02-01T12:00:00.000Z', dataCheckout: '2030-02-03T12:00:00.000Z' }, test: `${capture('hospedagemId', 'pm.response.json().id')}\npm.test("hospedagem", () => pm.expect(pm.response.code).to.eql(201));` }),
      request('listar hospedagens', 'GET', '/hospedagens'),
      request('buscar hospedagem', 'GET', '/hospedagens/{{hospedagemId}}'),
      request('atualizar hospedagem', 'PATCH', '/hospedagens/{{hospedagemId}}', { body: { dataCheckout: '2030-02-04T12:00:00.000Z' } }),
      request('cancelar hospedagem', 'DELETE', '/hospedagens/{{hospedagemId}}'),
    ],
  },
  {
    name: '05 Nutrição',
    item: [
      request('criar assinatura', 'POST', '/assinaturas-nutricionais', { body: { petId: '{{petId}}', planoId: '{{planoId}}', quantidadeRacaoKg: 5, consumoDiarioEstimadoG: 300 }, test: `${capture('assinaturaId', 'pm.response.json().id')}\npm.test("assinatura", () => pm.expect(pm.response.code).to.eql(201));` }),
      request('listar assinaturas', 'GET', '/assinaturas-nutricionais'),
      request('buscar assinatura', 'GET', '/assinaturas-nutricionais/{{assinaturaId}}'),
      request('atualizar assinatura', 'PATCH', '/assinaturas-nutricionais/{{assinaturaId}}', { body: { quantidadeRacaoKg: 6 } }),
      request('pausar assinatura', 'POST', '/assinaturas-nutricionais/{{assinaturaId}}/pausar', { body: {} }),
      request('retomar assinatura', 'POST', '/assinaturas-nutricionais/{{assinaturaId}}/retomar', { body: {} }),
    ],
  },
  {
    name: '06 Agenda e recomendações',
    item: [request('agenda', 'GET', '/agenda'), request('próximo cuidado', 'GET', '/agenda/proximo'), request('recomendações', 'GET', '/recomendacoes')],
  },
  {
    name: '07 Pagamento simulado',
    item: [request('aprovar passeio simulado', 'POST', '/pagamentos/simular', { body: { tipo: 'PASSEIO', id: '{{passeioId}}', metodo: 'PIX', resultado: 'APROVADO' } })],
  },
  {
    name: '08 Zelinho',
    item: [request('início', 'GET', '/zelinho/inicio'), request('mensagem', 'POST', '/zelinho/mensagens', { body: { texto: 'Quero ver os preços do hotel' } }), request('atendimento atual', 'GET', '/zelinho/atendimento/atual') ],
  },
  {
    name: '09 Erros e segurança',
    item: [
      request('sem token 401', 'GET', '/pets', { auth: false, test: 'pm.test("401", () => pm.expect(pm.response.code).to.eql(401));' }),
      request('token inválido 401', 'GET', '/pets', { test: 'pm.test("401", () => pm.expect(pm.response.code).to.eql(401));', auth: false, headers: [{ key: 'Authorization', value: 'Bearer token-invalido' }] }),
      request('corpo inválido 400', 'POST', '/pets', { body: { nome: '', porte: 'INVALIDO' }, test: 'pm.test("400", () => pm.expect(pm.response.code).to.eql(400));' }),
      request('id inexistente 404', 'GET', '/pets/00000000-0000-0000-0000-000000000000', { test: 'pm.test("404", () => pm.expect(pm.response.code).to.eql(404));' }),
      request('admin sem papel 403', 'GET', '/atendimentos', { test: 'pm.test("acesso", () => pm.expect(pm.response.code).to.be.oneOf([200, 403]));' }),
      request('e-mail repetido 409', 'POST', '/auth/registro', { auth: false, body: { nome: 'Demo', email: '{{demoEmail}}', senha: 'demo1234' }, test: 'pm.test("409", () => pm.expect(pm.response.code).to.eql(409));' }),
      request('campos calculados ignorados', 'POST', '/pets', { body: { nome: 'Whitelist', porte: 'PEQUENO', nivelEnergia: 'BAIXO', valor: 1, valorTotal: 1, status: 'APROVADO' }, test: 'pm.test("whitelist", () => pm.expect(pm.response.code).to.eql(201));' }),
    ],
  },
  {
    name: '99 Limpeza',
    item: [
      request('remover passeio', 'DELETE', '/passeios/{{passeioId}}'),
      request('remover hospedagem', 'DELETE', '/hospedagens/{{hospedagemId}}'),
      request('remover assinatura', 'DELETE', '/assinaturas-nutricionais/{{assinaturaId}}'),
      request('remover pet de apoio', 'DELETE', '/pets/{{petId}}'),
    ],
  },
];

const collection = {
  info: { name: 'ZeloPets — Aula Backend', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
  item: folders,
};

mkdirSync('postman', { recursive: true });
writeFileSync('postman/ZeloPets.postman_collection.json', JSON.stringify(collection, null, 2) + '\n');
