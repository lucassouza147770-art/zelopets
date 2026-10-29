# Prontidão para a avaliação

Atualizado em 2026-10-25. Este documento separa evidência executada de
funcionalidade ainda planejada; uma lacuna não deve ser apresentada como
concluída na demonstração.

| Área | Evidência no repositório | Estado |
|---|---|---|
| Back-end NestJS, Prisma e Swagger | `src/`, migrations e `/docs` | Atendido |
| Autenticação JWT e ownership | Guards e filtros por `tutorId` em pets, passeios, hospedagens, assinaturas, agenda e recomendações | Atendido |
| Estado controlado pelo servidor | `PATCH` genérico não aceita `status`; cancelamento usa operação própria | Atendido nesta rodada |
| CORS | `CORS_ORIGINS` em `.env.example` e configuração em `src/main.ts` | Atendido para configuração local |
| ML com One-Hot, imputação e StandardScaler | `ml-service/app/features.py`, `train.py` e artefato v2 | Atendido |
| Inicialização do ML | Modelo carregado no lifespan do FastAPI; modelo ausente aparece no health | Atendido |
| Justificativa de K | Notebook com K=2..10, perfis decodificados e conclusão honesta | Atendido |
| Recomendações integradas | Nest valida o pet, aplica timeout e chama `/recommend` | Atendido |
| Assinaturas com ciclo controlado | Rotas próprias de pausar, retomar e cancelar com ownership | Atendido nesta rodada |
| Home, Mobilidade e cadastro completo do pet | React, fluxo manual e builds verificados | Atendido |
| Identidade visual aplicada | Pacote visual em `frontend/public/assets` e hero interativo com CTA | Atendido nesta rodada |
| Zelinho local | Classificador determinístico de intenções para dúvidas de serviços | Atendido nesta rodada |
| Estrutura semântica | Header, nav, main, section e footer na aplicação autenticada | Atendido nesta rodada |
| Axe em Home e Mobilidade | 0 violações registradas em `docs/validacao-bloco2.md` | Atendido nessas duas telas |
| Lighthouse Snapshot autenticado | Não foi possível obter relatório local | Pendente do dono |
| Fluxo completo somente por teclado | Foco e duração verificados; `datetime-local` não permitiu confirmar envio | Pendente do dono |
| Área administrativa e papéis | Não existe módulo/guard administrativo | Pendente |
| Filtros e ordenação de vitrine/agenda | Ainda não há requisito implementado em todas as telas | Pendente |
| Chatbot Zelinho com NLU avaliado | Motor local ativo; bateria formal Q3/Q4 ainda não foi executada | Parcial |
| Recuperação de senha, Google login e avatar persistido | Não são fluxos completos no código atual | Pendente |
| Testes em navegadores reais | Não executados pelo agente | Pendente do dono |

## Como testar agora

1. Copie `.env.example` para `.env` e preencha os segredos localmente.
2. Execute `pnpm install`, `pnpm exec prisma migrate deploy` e
   `pnpm exec prisma db seed`.
3. Inicie API, frontend e ML nos três terminais conforme o
   [README](../README.md).
4. Rode `pnpm build`, `pnpm lint`, `pnpm test`,
   `pnpm --dir frontend build` e o pytest dentro de `ml-service`.
5. Para recomendações, execute o seed ML e retreine o modelo antes de iniciar
   o microsserviço.
6. Faça manualmente o Lighthouse Snapshot e o teste de teclado, pois dependem
   da sessão autenticada e dos controles nativos do Chrome.

## Decisões do chatbot

Não é necessária uma conta Google para a primeira entrega. O caminho mais
controlável e verificável é o classificador local de intenções exigido no
roteiro Q4, com TF-IDF, regressão logística, conjunto de teste separado e
fallback seguro. Dialogflow é uma integração opcional posterior: exige uma
conta Google, um projeto, intents configuradas manualmente e credenciais
guardadas apenas no `.env` do backend. Nenhuma chave deve ser enviada ao
frontend ou commitada.
