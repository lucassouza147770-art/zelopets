# Validação da Home e fechamento da Fase 2

## Validação responsiva e teclado

Na Home autenticada, a conferência visual foi feita em 360 × 640, 390 × 844,
768 × 900 e 1200 × 900. Não houve rolagem horizontal; as três linhas de serviço
ficaram visíveis na primeira tela nos quatro tamanhos, e a barra inferior
permaneceu visível. Em telas largas, o conteúdo ficou centralizado com largura
máxima de 480 px.

A navegação por Tab percorreu saldo, perfil, seletor do cão, os três serviços,
atalho do Zelinho e as quatro abas. Todos receberam foco visível. O item ativo
da navegação marca a página com `aria-current="page"`.

## Auditorias

- Lighthouse 13.5.0, rota raiz em sessão nova: Accessibility 100, SEO 100.
  O relatório inicial apontou falta de `robots.txt`; foi adicionada a regra
  pública permissiva para robôs e a auditoria foi repetida sem falhas de SEO.
- axe-core 4.14.0 na Home autenticada em 360 × 640: 30 verificações aprovadas,
  zero violações e zero resultados incompletos.
- O idioma `pt-BR`, títulos principais únicos e textos alternativos foram
  conferidos nas telas disponíveis. A Home não contém imagens de banco ou de
  geração automática; quando a API não fornece foto do cão, usa-se a inicial.

## Build e testes

Na validação final:

- `pnpm build`, `pnpm --dir frontend build` e
  `pnpm --dir frontend exec tsc --noEmit` passaram.
- `pnpm exec prisma validate` passou.
- Testes unitários: 1 suíte e 1 teste passaram.
- Testes e2e: 1 suíte e 1 teste passaram.
- `pnpm lint` passou com três avisos `no-misused-spread` nos serviços de
  passeio, hospedagem e assinatura nutricional do checkpoint; nenhum deles
  foi introduzido pela Home.

Não houve alteração em `ml-service`, `.env` ou migrations preexistentes. A
migration nova `tutor_zelocoins` foi aditiva.

Onde estamos: Fase 2 — Home final · Passo 5 de 5 concluído (commit pendente de autorização).
