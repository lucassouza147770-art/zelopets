# Backend NestJS explicado para a aula

Material curto para abrir no VS Code. As linhas abaixo são as linhas atuais do
código; use Ctrl+G.

## 1. Mapa para a aula

| Ordem | Arquivo | Linha |
|---:|---|---:|
| 1 | [main.ts](../../src/main.ts) | 6 |
| 2 | [app.module.ts](../../src/app.module.ts) | 16 |
| 3 | [schema.prisma](../../prisma/schema.prisma) | 13 |
| 4 | [prisma.service.ts](../../src/prisma/prisma.service.ts) | 18 |
| 5 | [auth.service.ts](../../src/auth/auth.service.ts) | 18 |
| 6 | [jwt.strategy.ts](../../src/auth/jwt.strategy.ts) | 14 |
| 7 | [jwt-auth.guard.ts](../../src/auth/jwt-auth.guard.ts) | 4 |
| 8 | [admin.guard.ts](../../src/auth/admin.guard.ts) | 4 |
| 9 | [pets.controller.ts](../../src/pets/pets.controller.ts) | 8 |
| 10 | [create-pet.dto.ts](../../src/pets/dto/create-pet.dto.ts) | 16 |
| 11 | [pets.service.ts](../../src/pets/pets.service.ts) | 35 |
| 12 | [passeio.service.ts](../../src/passeio/passeio.service.ts) | 18 |
| 13 | [hospedagem.service.ts](../../src/hospedagem/hospedagem.service.ts) | 8 |
| 14 | [recomendacao.service.ts](../../src/recomendacao/recomendacao.service.ts) | 78 |
| 15 | [zelinho.service.ts](../../src/zelinho/zelinho.service.ts) | 35 |

## 2. Ciclo de vida da requisição

```text
cliente
  -> CORS (main.ts:8)
  -> ValidationPipe (main.ts:12)
  -> JwtAuthGuard, quando a rota exige JWT (pets.controller.ts:10)
  -> controller
  -> service
  -> PrismaService/Prisma Client (prisma.service.ts:18)
  -> PostgreSQL (DATABASE_URL)
  -> resposta HTTP
```

O projeto não tem `ThrottlerModule` nem `ThrottlerGuard` global. O limite do
Zelinho é próprio do service: 20 mensagens por minuto e 200 por dia
([zelinho.service.ts](../../src/zelinho/zelinho.service.ts):14-16).

## 3. Visão por módulo

### Auth
Objetivo: registrar tutor e emitir JWT. Árvore: `auth.controller.ts`,
`auth.service.ts`, `dto/`, `jwt.strategy.ts`, `jwt-auth.guard.ts`,
`admin.guard.ts`. Rotas: `POST /auth/registro`
([auth.controller.ts](../../src/auth/auth.controller.ts):10) chama
`register`, que faz `tutor.findUnique` e `tutor.create`
([auth.service.ts](../../src/auth/auth.service.ts):20-34); `POST /auth/login`
([auth.controller.ts](../../src/auth/auth.controller.ts):15) chama `login`,
busca por email e compara bcrypt ([auth.service.ts](../../src/auth/auth.service.ts):41-53).
O retorno é `{ accessToken }`.

### Tutor
Objetivo: retornar somente o perfil do tutor autenticado. `GET /tutores/me`
([tutor.controller.ts](../../src/tutor/tutor.controller.ts):14) chama
`obterPerfil`, que usa `tutor.findUnique` ([tutor.service.ts](../../src/tutor/tutor.service.ts):9).

### Pets
Objetivo: CRUD do perfil do pet. A árvore é `pets.controller.ts`,
`pets.service.ts`, `dto/create-pet.dto.ts` e `dto/update-pet.dto.ts`.
`GET /pets` linha 14, `GET /pets/:id` linha 19, `POST /pets` linha 24,
`PATCH /pets/:id` linha 29 e `DELETE /pets/:id` linha 38
([pets.controller.ts](../../src/pets/pets.controller.ts)) chamam,
respectivamente, `findMany`, `findFirst`, `create`, `update` e `delete`
([pets.service.ts](../../src/pets/pets.service.ts):41-106). Todos recebem
`request.user.tutorId` e colocam esse valor no `where`.

### Prestadores
Objetivo: listar catálogo ativo e permitir manutenção autenticada.
`GET /prestadores` e `GET /prestadores/:id` são públicos
([prestador.controller.ts](../../src/prestador/prestador.controller.ts):23-31);
POST/PATCH/DELETE exigem `JwtAuthGuard` e `AdminGuard` (linhas 33-50). O service usa `findMany`,
`findFirst`, `create`, `update` e inativação lógica
([prestador.service.ts](../../src/prestador/prestador.service.ts):12-39).

### Passeios e transporte
Objetivo: criar e acompanhar mobilidade. As rotas estão em
[passeio.controller.ts](../../src/passeio/passeio.controller.ts):26-59.
`criar` valida que o pet pertence ao tutor e calcula `valor` no servidor
([passeio.service.ts](../../src/passeio/passeio.service.ts):25-53); listar,
buscar, atualizar e cancelar usam `tutorId` no filtro
([passeio.service.ts](../../src/passeio/passeio.service.ts):59-109).

### Hospedagens
Objetivo: reservar hotel por diária. As cinco rotas estão em
[hospedagem.controller.ts](../../src/hospedagem/hospedagem.controller.ts):26-54.
`criar` valida pet/pacote, calcula diárias e `valorTotal` no service
([hospedagem.service.ts](../../src/hospedagem/hospedagem.service.ts):12-40).

### Assinaturas
Objetivo: assinar plano nutricional e pausar/retomar/cancelar.
As oito rotas estão em [assinatura-nutricional.controller.ts](../../src/assinatura-nutricional/assinatura-nutricional.controller.ts):26-68.
O service valida pet/plano, calcula previsão e filtra pelo tutor
([assinatura-nutricional.service.ts](../../src/assinatura-nutricional/assinatura-nutricional.service.ts):19-120).

### Catálogo
Objetivo: expor pacotes e planos públicos. `GET /pacotes-hospedagem` e
`GET /planos-nutricionais` ([catalogo.controller.ts](../../src/catalogo/catalogo.controller.ts):8-16)
chamam `findMany` ordenado por preço
([catalogo.service.ts](../../src/catalogo/catalogo.service.ts):9-14).

### Agenda
Objetivo: unir passeios, hospedagens e entregas futuras. `GET /agenda` e
`GET /agenda/proximo` ([agenda.controller.ts](../../src/agenda/agenda.controller.ts):14-22)
chamam `listar`, que faz três `findMany` em paralelo filtrando `tutorId`
([agenda.service.ts](../../src/agenda/agenda.service.ts):20-54).

### Recomendações
Objetivo: pedir ao modelo um cluster e prestadores compatíveis.
`GET /recomendacoes` ([recomendacao.controller.ts](../../src/recomendacao/recomendacao.controller.ts):21-34)
chama `obter`, valida o pet do tutor, faz `fetch` de
`/recommend/{tutorId}` e consulta os prestadores retornados
([recomendacao.service.ts](../../src/recomendacao/recomendacao.service.ts):78-171).

### Pagamentos simulados
Objetivo: demonstrar aprovação/recusa sem gateway real.
`POST /pagamentos/simular` ([pagamento.controller.ts](../../src/pagamento/pagamento.controller.ts):13)
chama `simular`; o service aceita só tipos conhecidos, filtra por tutor e
altera apenas `statusPagamento` ([pagamento.service.ts](../../src/pagamento/pagamento.service.ts):12-26).

### Zelinho
Objetivo: conversar, orientar e abrir atendimento humano. As rotas estão em
[zelinho.controller.ts](../../src/zelinho/zelinho.controller.ts):13-30.
O service mantém estado de agendamento em `Map` em memória e chama
`/chat/mensagem` no FastAPI ([zelinho.service.ts](../../src/zelinho/zelinho.service.ts):352-375).

### Admin e atendimentos
Objetivo: permitir que ADMIN veja e atualize chamados. `GET /atendimentos` e
`PATCH /atendimentos/:id` exigem `JwtAuthGuard` e `AdminGuard`
([atendimento.controller.ts](../../src/atendimento/atendimento.controller.ts):19-28);
o service consulta/atualiza `atendimentoHumano`
([atendimento.service.ts](../../src/atendimento/atendimento.service.ts):9-23).

### Saúde
Objetivo: mostrar estado do banco e do FastAPI. `GET /saude`
([app.controller.ts](../../src/app.controller.ts):13) usa `SELECT 1` e
`/chat/saude` ([app.service.ts](../../src/app.service.ts):13-39), retornando
`ok` ou `degradado`.

## 4. CRUD de Pets, passo a passo

- **C** `POST /pets`: decorator/método em
  [pets.controller.ts](../../src/pets/pets.controller.ts):24-26; DTO em
  [create-pet.dto.ts](../../src/pets/dto/create-pet.dto.ts):16-59; `create`
  força `Especie.CACHORRO`, inicializa arrays e chama `pet.create`
  ([pets.service.ts](../../src/pets/pets.service.ts):55-78). Sucesso 201;
  erro 400 para validação/foto/data e 401 sem JWT.
- **R** `GET /pets`: `findMany` com `where: { tutorId }`, 200 lista.
  `GET /pets/:id`: `findFirst({ where: { id, tutorId } })`; se não achar,
  404 `Pet não encontrado`.
- **U** `PATCH /pets/:id`: `UpdatePetDto` é `PartialType(CreatePetDto)`;
  recalcula validações e chama `pet.update` ([pets.service.ts](../../src/pets/pets.service.ts):82-103).
  Sucesso 200; 400/401/404 conforme validação, autenticação ou id.
- **D** `DELETE /pets/:id`: confirma propriedade com `findOne` e chama
  `pet.delete` somente sem passeios, hospedagens ou assinaturas vinculadas
  ([pets.service.ts](../../src/pets/pets.service.ts):105-126). Com reservas,
  responde 409 `Este pet tem reservas; cancele antes`; sem vínculos, sucesso
  200 com o pet removido.

## 5. Validação com DTO

Em [create-pet.dto.ts](../../src/pets/dto/create-pet.dto.ts), `IsString` exige
texto, `IsNotEmpty` impede nome vazio, `IsEnum` restringe porte/energia,
`IsDateString` valida data, `Validate(DataNaoFutura)` impede data futura,
`IsNumber`/`Min`/`Max` limitam peso, `IsArray` e `IsString({each:true})`
validam listas e os campos opcionais só são validados quando enviados.
O pipe está em [main.ts](../../src/main.ts):12-20. `whitelist: true` remove
campos extras; não rejeita o corpo por campo desconhecido.

## 6. Segurança

`AuthService.gerarToken` assina `sub`, `email` e `papel`
([auth.service.ts](../../src/auth/auth.service.ts):57-61). O segredo vem de
`JWT_SECRET`; `JwtStrategy` valida assinatura e expiração
([jwt.strategy.ts](../../src/auth/jwt.strategy.ts):14-27), com validade padrão
do `JwtModule` configurada no módulo Auth. Registro e login usam bcrypt
([auth.service.ts](../../src/auth/auth.service.ts):29,49).
`JwtAuthGuard` protege rotas de tutor; `AdminGuard` exige `papel === ADMIN`
([admin.guard.ts](../../src/auth/admin.guard.ts):4-11).

O isolamento aparece em `request.user.tutorId` no controller e em filtros como
`where: { id, tutorId }` nos services de pets, passeios, hospedagens,
assinaturas e pagamentos. Preços são calculados no servidor em
[passeio.service.ts](../../src/passeio/passeio.service.ts):10-15 e
[hospedagem.service.ts](../../src/hospedagem/hospedagem.service.ts):28-40;
status também é alterado por operações do service. CORS usa `CORS_ORIGINS`
([main.ts](../../src/main.ts):8). O token Nest-Python usa `X-Internal-Token`;
o FastAPI compara com `hmac.compare_digest`
([ml-service/app/main.py](../../ml-service/app/main.py):68).

## 7. Prisma e banco

```text
Tutor 1--N Pet, Passeio, Hospedagem, AssinaturaNutricional, AtendimentoHumano
Pet 1--N Passeio/Hospedagem/Assinatura; Pet 1--1 PerfilPetCluster
Prestador 1--N Passeio/Hospedagem/Avaliacao
PacoteHospedagem 1--N Hospedagem
PlanoNutricional 1--N AssinaturaNutricional
```

Enums principais: `Especie`, `Porte`, `NivelEnergia`, `TipoPrestador`,
`TipoPasseio`, `FaixaDistancia`, `StatusAgendamento`, `StatusAssinatura`,
`StatusPagamento`, `PapelTutor`, prioridades/status de atendimento. Models
completos estão em [schema.prisma](../../prisma/schema.prisma).

Migrations, em ordem: `20260917062334_init`,
`20260923031701_remover_gato_especie`, `20260926034045_prestador_perfil_atendimento`,
`20261021232142_tutor_zelocoins`, `20261105210000_transporte_passeio`,
`20261106000000_atendimentos_humanos`. O seed cria catálogo, tutor demo,
pet Bento, dois prestadores e admin somente quando `ADMIN_DEMO_PASSWORD` existe
([seed.ts](../../prisma/seed.ts):11-116). `PrismaService` usa `@prisma/adapter-pg`
porque Prisma 7 conecta o client ao PostgreSQL por adapter
([prisma.service.ts](../../src/prisma/prisma.service.ts):18-22).

## 8. Integração com IA

Recomendações fazem GET `/recommend/{tutorId}` com `pet_id`, token interno e
timeout de 3 segundos ([recomendacao.service.ts](../../src/recomendacao/recomendacao.service.ts):98-115).
Zelinho faz POST `/chat/mensagem`, token e timeout de 8 segundos
([zelinho.service.ts](../../src/zelinho/zelinho.service.ts):352-375).
Sem token, timeout, resposta inválida ou FastAPI fora do ar, recomendações
retornam 503; Zelinho fica em modo reduzido e usa regras locais/estado em memória.

## 9. S.O.L.I.D. com evidência

- **S**: controllers só adaptam HTTP e services concentram regra, por exemplo
  `PetsController`/`PetsService`.
- **O**: `CreatePetDto` pode ser estendido por `UpdatePetDto` sem alterar o
  DTO original.
- **L**: `PrismaService` é usado como cliente Prisma nos services sem mudar o
  contrato esperado.
- **I**: controllers dependem de interfaces/tipos pequenos de `request.user`,
  não de um objeto HTTP inteiro.
- **D**: Nest injeta `PrismaService` e `JwtService` nos constructors.
  Não é uma aplicação acadêmica de SOLID perfeito: alguns controllers ainda
  usam tipos locais e `AtendimentoController` recebe corpo sem DTO dedicado.

## 10. Verbos HTTP

| Ação | Verbo usado |
|---|---|
| criar | POST |
| consultar | GET |
| alterar parte | PATCH |
| remover/cancelar | DELETE (ou POST em ações `pausar`, `retomar`, `cancelar`) |

Não existe `PUT`. PUT substituiria o recurso inteiro; PATCH altera parte. O
projeto escolhe PATCH porque os DTOs de atualização são parciais.

## 11. Limitações conhecidas

- Foto do pet é data URL base64, limitada a 150 KB; não há armazenamento de
  arquivos.
- Estado de conversa/agendamento do Zelinho fica em memória e se perde ao
  reiniciar ou ao distribuir múltiplas instâncias.
- Pagamento é simulado; não há gateway, cobrança ou webhook.
- O backend não tem throttler global; há apenas os limites próprios do Zelinho.
- Regras de prestador ainda permitem manutenção a qualquer tutor autenticado;
  não existe guard de papel específico nessa área.
- Recomendações dependem do modelo e do FastAPI; fora do ar, a resposta é 503.
- `Especie` hoje aceita somente `CACHORRO`.
- O seed admin depende de segredo fornecido no ambiente e não imprime esse
  segredo.
