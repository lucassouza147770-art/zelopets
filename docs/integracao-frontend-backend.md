# Integracao frontend-backend

## Cliente HTTP

O frontend concentra as chamadas em `frontend/src/api/client.ts`. O cliente
usa `VITE_API_URL` quando definida e, por padrao, aponta para
`http://localhost:3000`. Ele adiciona `Content-Type: application/json`, envia
o Bearer token quando recebido e converte respostas nao-2xx em `ApiError` com
status e mensagem.

## Token

`frontend/src/api/auth.ts` salva o `accessToken` em `localStorage` usando a
chave `zelopets:accessToken`. Login e registro chamam os endpoints reais de
`AuthController` e salvam o token retornado. O cadastro e o painel recuperam
essa chave para chamar rotas protegidas.

## Fluxo de Pet

- `POST /pets` cria um pet vinculado ao tutor identificado pelo JWT.
- `GET /pets` lista somente os pets do tutor autenticado.
- O backend define `especie: CACHORRO`, conforme o schema atual.
- O frontend envia nome, porte e nivel de energia, que sao os campos
  obrigatorios da tela nesta etapa.

O backend habilita CORS em `src/main.ts`, permitindo que o Vite em outra origem
consuma a API local.

## Estados e falhas

Login/registro exibem carregamento e erro da API. O cadastro mostra sucesso ou
falha na criacao. O painel tem estados de carregamento, sem pet e erro ao
buscar os pets. Um token ausente ou expirado faz a chamada protegida falhar e
precisa de novo login.

## O que continua simulado

A `FaixaDeAgendamento` continua simulada como estado vazio, porque ainda nao
existe endpoint de agendamentos. As portas de cuidado e o acesso ao Zelinho
ainda sao apenas estrutura de interface. O upload de foto permanece local:
a tela mostra preview, mas ainda nao envia o arquivo para a API.
