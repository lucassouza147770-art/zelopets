# Autenticação (JWT)

## Visão geral

O módulo de autenticação fica em `src/auth`, com o Prisma isolado em
`src/prisma`. O fluxo é registro/login clássico com JWT, sem login social
nesta fase.

## Endpoints

- `POST /auth/registro`: recebe `{ nome, email, senha }`, cria o `Tutor` com a
  senha hasheada via bcrypt (custo 10) e devolve `{ accessToken }`.
- `POST /auth/login`: recebe `{ email, senha }`, valida contra o hash salvo e
  devolve `{ accessToken }`.

## Como funciona

1. `RegisterDto` e `LoginDto` validam o corpo com `class-validator`. O
   `ValidationPipe` global está ativado em `src/main.ts` com `whitelist: true`.
2. `AuthService` usa `PrismaService` para consultar ou criar o `Tutor` e usa
   `bcrypt` para hash e comparação de senha.
3. `JwtService` assina o token com `JWT_SECRET`, carregado do `.env`, com
   validade de 7 dias.
4. `JwtStrategy` valida tokens Bearer. `JwtAuthGuard` aplica essa proteção em
   controllers que usarem `@UseGuards(JwtAuthGuard)`.

## Banco de dados

O Prisma 7 exige um driver adapter para uma conexão PostgreSQL direta.
`PrismaService` usa `@prisma/adapter-pg` e `pg` com `DATABASE_URL` do Neon.

## Erros tratados

- E-mail já cadastrado no registro: `409 Conflict`.
- E-mail ou senha inválidos no login: `401 Unauthorized`, com mensagem
  genérica para não revelar qual credencial falhou.

## Pendências conhecidas

- Nenhuma rota usa `JwtAuthGuard` ainda; isso entra com os CRUDs de
  Passeio, Hospedagem e Nutrição.
- O enum `Especie` do pet agora contém somente `CACHORRO`, conforme a regra
  atual do produto.