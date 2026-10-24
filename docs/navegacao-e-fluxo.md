# Navegação e fluxo de entrada

## Entrada e sessão

Ao abrir o app, um token salvo é validado consultando `GET /pets`. Sem token,
o app mostra login e cadastro de tutor. Após autenticar, consulta os cães: sem
cães, apresenta o formulário de cadastro; com ao menos um cão, abre a Home.
Depois de criar o primeiro cão, o app abre a Home.

Um `401` em qualquer chamada autenticada limpa o token local e retorna à tela
de login. Falhas de rede não encerram silenciosamente a sessão: a aplicação
mostra uma mensagem e oferece nova tentativa.

## Destinos

| Destino | Acesso | Conteúdo |
| --- | --- | --- |
| Início | Barra inferior | Home com saldo, cão ativo, próximo cuidado e três serviços. |
| Agenda | Barra inferior | Próximos cuidados de `GET /agenda` e estado vazio. |
| Zelinho | Barra inferior ou atalho | Tela provisória de atendimento. |
| Perfil | Barra inferior ou ícone do cabeçalho | Nome, e-mail e cães de `GET /tutores/me` e `GET /pets`. |
| Carteira | Chip de ZeloCoins | Saldo atual do tutor; histórico e acúmulo em construção. |
| Mobilidade, Hotel e Nutrição | Respectiva linha de serviço | Tela provisória com título do serviço e botão Voltar. |

A navegação inferior tem quatro destinos. Carteira e telas de serviço não
adicionam abas. Cada estado de tela renderiza um único elemento `<main>` e
mantém um único `<h1>`.

Onde estamos: Fase 2 — Home final · Passo 4 de 5 concluído (commit pendente de autorização).
