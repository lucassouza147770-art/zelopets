# Rotas da API ZeloPets

Inventário conferido nos controllers e no Swagger (`GET /docs-json`). O prefixo
é sempre `/`; não existe `PUT`. DTOs desconhecidos ou campos extras são
removidos pela `ValidationPipe({ whitelist: true })`.

## 00 Saúde e login

| Método | Caminho | Acesso | Corpo obrigatório | Sucesso | Erros comuns |
|---|---|---|---|---|---|
| GET | `/` | público | — | 200 texto | — |
| GET | `/saude` | público | — | 200 `{status,banco,mlService,...}` | 200 degradado |
| POST | `/auth/registro` | público | `nome,email,senha` | 201 `{accessToken}` | 400, 409 |
| POST | `/auth/login` | público | `email,senha` | 200 `{accessToken}` | 400, 401 |

## 01 CRUD de pets

| Método | Caminho | Acesso | Corpo obrigatório | Sucesso | Erros comuns |
|---|---|---|---|---|---|
| POST | `/pets` | JWT | `nome,porte,nivelEnergia` | 201 pet | 400, 401 |
| GET | `/pets` | JWT | — | 200 lista | 401 |
| GET | `/pets/:id` | JWT | — | 200 pet | 401, 404 |
| PATCH | `/pets/:id` | JWT | parcial | 200 pet | 400, 401, 404 |
| DELETE | `/pets/:id` | JWT | — | 200 pet removido | 401, 404, 409 |

Exemplo POST: `{"nome":"Luna","porte":"MEDIO","nivelEnergia":"ALTO","raca":"SRD","pesoKg":12}`.
Exemplo PATCH: `{"nome":"Luna Atualizada","pesoKg":13}`.

## 02 Prestadores e catálogo

| Método | Caminho | Acesso | Corpo obrigatório | Sucesso | Erros comuns |
|---|---|---|---|---|---|
| GET | `/prestadores` | público | — (`tipo` opcional) | 200 lista ativa | 400 |
| GET | `/prestadores/:id` | público | — | 200 prestador | 404 |
| POST | `/prestadores` | ADMIN | `nome,tipo` | 201 prestador | 400, 401, 403 |
| PATCH | `/prestadores/:id` | ADMIN | parcial | 200 prestador | 400, 401, 403, 404 |
| DELETE | `/prestadores/:id` | ADMIN | — | 200 inativa | 401, 403, 404 |
| GET | `/pacotes-hospedagem` | público | — | 200 catálogo | — |
| GET | `/planos-nutricionais` | público | — | 200 catálogo | — |

POST prestador: `{"nome":"Passeador Aula","tipo":"PASSEADOR","experienciaAnos":2,"portesAtendidos":["MEDIO"]}`.
PATCH prestador: `{"bio":"Atende aos sábados"}`.

## 03 Passeios e transporte

| Método | Caminho | Acesso | Corpo obrigatório | Sucesso | Erros comuns |
|---|---|---|---|---|---|
| POST | `/passeios` | JWT | `petId,dataHora` | 201 passeio | 400, 401, 404 |
| GET | `/passeios` | JWT | — | 200 lista do tutor | 401 |
| GET | `/passeios/proximo` | JWT | — | 200 passeio/null | 401 |
| GET | `/passeios/:id` | JWT | — | 200 passeio | 401, 404 |
| PATCH | `/passeios/:id` | JWT | parcial | 200 passeio | 400, 401, 404 |
| DELETE | `/passeios/:id` | JWT | — | 200 status CANCELADO | 401, 404 |

POST passeio: `{"petId":"{{petId}}","dataHora":"2030-01-01T10:00:00.000Z","duracaoMinutos":30}`.
POST transporte: `{"tipo":"TRANSPORTE","petId":"{{petId}}","dataHora":"2030-01-01T10:00:00.000Z","origem":"A","destino":"B","faixaDistancia":"ATE_3KM"}`.
PATCH passeio: `{"dataHora":"2030-01-02T10:00:00.000Z","duracaoMinutos":45}`.

## 04 Hospedagens

| Método | Caminho | Acesso | Corpo obrigatório | Sucesso | Erros comuns |
|---|---|---|---|---|---|
| POST | `/hospedagens` | JWT | `petId,pacoteId,dataCheckin,dataCheckout` | 201 hospedagem | 400, 401, 404 |
| GET | `/hospedagens` | JWT | — | 200 lista do tutor | 401 |
| GET | `/hospedagens/:id` | JWT | — | 200 hospedagem | 401, 404 |
| PATCH | `/hospedagens/:id` | JWT | parcial | 200 hospedagem | 400, 401, 404 |
| DELETE | `/hospedagens/:id` | JWT | — | 200 status CANCELADO | 401, 404 |

POST: `{"petId":"{{petId}}","pacoteId":"{{pacoteId}}","dataCheckin":"2030-01-01T12:00:00.000Z","dataCheckout":"2030-01-03T12:00:00.000Z"}`.
PATCH: `{"dataCheckout":"2030-01-04T12:00:00.000Z"}`.

## 05 Nutrição

| Método | Caminho | Acesso | Corpo obrigatório | Sucesso | Erros comuns |
|---|---|---|---|---|---|
| POST | `/assinaturas-nutricionais` | JWT | `petId,planoId,quantidadeRacaoKg,consumoDiarioEstimadoG` | 201 assinatura | 400, 401, 404 |
| GET | `/assinaturas-nutricionais` | JWT | — | 200 lista | 401 |
| GET | `/assinaturas-nutricionais/:id` | JWT | — | 200 assinatura | 401, 404 |
| PATCH | `/assinaturas-nutricionais/:id` | JWT | parcial | 200 assinatura | 400, 401, 404 |
| POST | `/assinaturas-nutricionais/:id/pausar` | JWT | — | 201 assinatura | 401, 404 |
| POST | `/assinaturas-nutricionais/:id/retomar` | JWT | — | 201 assinatura | 401, 404 |
| POST | `/assinaturas-nutricionais/:id/cancelar` | JWT | — | 201 assinatura | 401, 404 |
| DELETE | `/assinaturas-nutricionais/:id` | JWT | — | 200 assinatura | 401, 404 |

POST: `{"petId":"{{petId}}","planoId":"{{planoId}}","quantidadeRacaoKg":5,"consumoDiarioEstimadoG":300}`.
PATCH: `{"quantidadeRacaoKg":6}`.

## 06 Agenda e recomendações

| Método | Caminho | Acesso | Corpo obrigatório | Sucesso | Erros comuns |
|---|---|---|---|---|---|
| GET | `/agenda` | JWT | — | 200 cuidados futuros | 401 |
| GET | `/agenda/proximo` | JWT | — | 200 `{proximo}` | 401 |
| GET | `/recomendacoes` | JWT | — (`petId` opcional) | 200 recomendações | 401, 404, 503 |

## 07 Pagamento simulado

| Método | Caminho | Acesso | Corpo obrigatório | Sucesso | Erros comuns |
|---|---|---|---|---|---|
| POST | `/pagamentos/simular` | JWT | `tipo,id,metodo,resultado` | 201 registro atualizado | 400, 401, 404, 409 |

POST: `{"tipo":"PASSEIO","id":"{{passeioId}}","metodo":"PIX","resultado":"APROVADO"}`.
O servidor decide o status; `metodo` é apenas entrada da simulação.

## 08 Zelinho

| Método | Caminho | Acesso | Corpo obrigatório | Sucesso | Erros comuns |
|---|---|---|---|---|---|
| GET | `/zelinho/inicio` | JWT | — | 200 saudação/menu | 401 |
| POST | `/zelinho/mensagens` | JWT | `texto` | 201 resposta | 400, 401, 404, 429, 503 |
| GET | `/zelinho/atendimento/atual` | JWT | — | 200 atendimento/null | 401 |

POST: `{"texto":"Quero ver os preços do hotel"}`.

## 09 Atendimentos administrativos

| Método | Caminho | Acesso | Corpo obrigatório | Sucesso | Erros comuns |
|---|---|---|---|---|---|
| GET | `/atendimentos` | ADMIN | — | 200 lista | 401, 403 |
| PATCH | `/atendimentos/:id` | ADMIN | parcial `status,respostaEquipe` | 200 atendimento | 400, 401, 403, 404 |

PATCH: `{"status":"RESOLVIDO","respostaEquipe":"Atendimento concluído"}`.

## Observações para a aula

- Não há decorator `@Put` no projeto; atualizações usam `PATCH` porque os DTOs
  de atualização são parciais.
- `valor`, `valorTotal` e `status` não estão nos DTOs de criação/atualização:
  com `whitelist`, esses campos são removidos do corpo. Preços, status inicial e
  transições são decididos no service.
- As alterações de prestadores exigem JWT de ADMIN. Excluir pet com passeio,
  hospedagem ou assinatura vinculados retorna 409 com
  `Este pet tem reservas; cancele antes`; registros relacionados não são apagados.
- O código não registra `ThrottlerModule`; o limite de 20 mensagens/minuto do
  Zelinho é uma regra própria do service, não um throttler global.
