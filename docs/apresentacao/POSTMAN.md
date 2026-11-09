# Guia rápido do Postman

1. Copie `.env.example` para `.env`, configure `DATABASE_URL`, `JWT_SECRET` e,
   para o admin local, `ADMIN_DEMO_PASSWORD=admin1234` (senha apenas de
   demonstração; não use em produção).
2. Suba PostgreSQL, o Nest (`pnpm start:dev`) e, se quiser recomendações/chat
   completos, o FastAPI na porta 8000.
3. Execute `pnpm prisma migrate deploy` e `pnpm prisma db seed`.
4. Importe [ZeloPets.postman_collection.json](../../postman/ZeloPets.postman_collection.json)
   e [ZeloPets.postman_environment.json](../../postman/ZeloPets.postman_environment.json).
5. Selecione **ZeloPets Local** e rode as pastas na ordem. O login grava
   `token`; o segundo tutor grava `tokenB`; o admin grava `adminToken`.
6. A pasta `01 CRUD de Pets` é a demonstração principal e está na ordem
   POST, lista, detalhe, PATCH, DELETE e detalhe 404.

A preparação automatizada esperada é `pnpm aula:preparar`: ela executa
`pnpm verificar`, seed idempotente e Newman, imprimindo `PRONTO PARA A AULA`
ou a lista de falhas. A execução real depende de PostgreSQL, do ambiente local
e, para as rotas de IA, do FastAPI/modelo.
