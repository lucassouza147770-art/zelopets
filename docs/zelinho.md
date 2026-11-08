# Zelinho

## Arquitetura

O frontend envia mensagens autenticadas ao Nest em `/zelinho/mensagens`. O
Nest valida limites, encaminha ao `ml-service` com `X-Internal-Token` e devolve
intenção, confiança, sugestões, confirmação ou handoff. O serviço Python
mantém o estado curto da conversa e aplica regras de alta precisão antes do
modelo estatístico.

O Nest também mantém o estado temporário de agendamento: identifica o serviço,
pergunta o pet quando há mais de um, coleta data e horário, confirma antes de
gravar e oferece `Ver na agenda`. Perguntas de catálogo, planos, saldo e
agenda são respondidas com dados atuais do banco.

Chamados são persistidos em `AtendimentoHumano`. O tutor consulta
`/zelinho/atendimento/atual`; a equipe admin usa `/atendimentos` para listar e
alterar status.

## Saúde e degradação

- `GET /saude` no Nest verifica banco, ml-service, token e modelo.
- `GET /chat/saude` informa versão, modelo carregado e número de intenções.
- Falha do ml-service produz modo reduzido com assuntos e atendimento, nunca
  uma tela branca ou erro cru.

## Privacidade e limites

Não são registrados tokens. O resumo de um atendimento contém somente o texto
recente da conversa, limitado a 300 caracteres. Há limite de 20 mensagens por
minuto e 200 por dia por tutor; no máximo três chamados por tutor por dia e
um chamado aberto por vez.

## Como demonstrar o Zelinho em 2 minutos

Entre com um tutor demo, abra o Zelinho e envie: `oi`, `quero agendar um
passeio pro Thor amanhã`, `quanto custa o hotel?`, `planos de ração`,
`quando vai acabar minha ração?`, `qual meu próximo agendamento?`, `quantas
moedas eu tenho?`, `asdfgh`, `blablabla xyz` e `meu cachorro se machucou no
hotel`. As respostas exibem sugestões, confirmação, protocolo e prioridade
alta quando aplicável.
