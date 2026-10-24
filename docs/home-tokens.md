# Tokens e clientes da Home

As cores existentes foram preservadas e complementadas pelos tokens de menta,
superfície, acento suave e texto suave. O tom de verde-escuro foi ajustado ao
valor da paleta definida para a Home. Os chips de status têm texto e cor
específicos para estados agendado, pendente e cancelado.

As regras de movimento foram limitadas ao feedback de toque das linhas de
serviço e à entrada do cartão de próximo cuidado; ambas só são ativadas quando
o sistema não solicita movimento reduzido. A regra de destaque de serviço foi
retirada após verificar que a tela antiga do Painel era a única referência
além das folhas de estilo.

`frontend/src/api/tutor.ts` expõe o tipo `Tutor` e `obterTutor(token)` para
buscar o perfil e o saldo real em `GET /tutores/me`. `frontend/src/api/agenda.ts`
define os tipos de cuidado e oferece `obterProximoCuidado(token)` e
`obterAgenda(token)`, usando o contrato existente de `api` sem alterar
`client.ts` nem `auth.ts`.

Onde estamos: Fase 2 — Home final · Passo 2 de 5 concluído (commit pendente de autorização).
