# API de hospedagens

O módulo de hospedagens permite consultar reservas e criar, consultar, atualizar
ou cancelar uma reserva do tutor autenticado. Todas as rotas exigem JWT. O
`tutorId` vem do token; o cliente não escolhe o tutor no corpo da requisição.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/hospedagens` | Cria uma hospedagem para um pet do tutor. |
| `GET` | `/hospedagens` | Lista as hospedagens do tutor, ordenadas pelo check-in. |
| `GET` | `/hospedagens/:id` | Consulta uma hospedagem do tutor. |
| `PATCH` | `/hospedagens/:id` | Atualiza prestador, datas, pacote ou status. |
| `DELETE` | `/hospedagens/:id` | Cancela a hospedagem, definindo o status como `CANCELADO`. |

## Criar uma hospedagem

Use um `petId` retornado por `GET /pets` e um `pacoteId` retornado por
`GET /pacotes-hospedagem`. O exemplo abaixo representa um corpo de criação:

```json
{
  "petId": "<id-do-pet>",
  "pacoteId": "<id-do-pacote>",
  "dataCheckin": "2030-06-15T12:00:00.000Z",
  "dataCheckout": "2030-06-18T12:00:00.000Z"
}
```

`prestadorId` é opcional. As datas devem estar em formato ISO; o check-out deve
ser posterior ao check-in. O servidor calcula `valorTotal` multiplicando o
preço diário do pacote pelo número de diárias arredondado para cima. A API não
aceita o valor total enviado pelo cliente.

As respostas de listagem e consulta incluem os dados relacionados do pet, do
pacote e do prestador. O `PATCH` aceita parcialmente `pacoteId`, `prestadorId`,
`dataCheckin`, `dataCheckout` e um `status` de `StatusAgendamento`; o `petId`
não pode ser alterado. Quando mudar qualquer data ou o pacote, o servidor
valida que o check-out continua posterior ao check-in e recalcula `valorTotal`
com o preço diário do pacote selecionado. Atualizações apenas de status ou
prestador mantêm o total já registrado.

A exclusão lógica mantém o registro e muda o status para `CANCELADO`. O tutor
pode alterar o próprio `status`; regras de transição entre status ficam para
uma etapa futura.

## Autorização e isolamento

Envie `Authorization: Bearer <accessToken>` nas rotas deste módulo. A criação
e as alterações verificam que o pet pertence ao tutor autenticado; consultas,
atualizações e cancelamentos também limitam o registro ao tutor do token.

Onde estamos: Bloco 2 · Passo A de 6 concluído (commit pendente de autorização).
