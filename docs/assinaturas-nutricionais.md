# API de assinaturas nutricionais

O módulo permite gerenciar assinaturas de alimentação para cães. Todas as
rotas exigem JWT, e o tutor é identificado pelo token, não pelo corpo da
requisição.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/assinaturas-nutricionais` | Cria uma assinatura para um pet do tutor. |
| `GET` | `/assinaturas-nutricionais` | Lista as assinaturas do tutor, da mais recente para a mais antiga. |
| `GET` | `/assinaturas-nutricionais/:id` | Consulta uma assinatura do tutor. |
| `PATCH` | `/assinaturas-nutricionais/:id` | Atualiza plano, quantidade e consumo; não altera status. |
| `POST` | `/assinaturas-nutricionais/:id/pausar` | Pausa a assinatura. |
| `POST` | `/assinaturas-nutricionais/:id/retomar` | Retoma uma assinatura pausada. |
| `POST` | `/assinaturas-nutricionais/:id/cancelar` | Cancela a assinatura. |
| `DELETE` | `/assinaturas-nutricionais/:id` | Alias compatível para cancelamento lógico. |

## Criar uma assinatura

Consulte `GET /pets` e `GET /planos-nutricionais` para obter os identificadores
necessários. Exemplo:

```json
{
  "petId": "<id-do-pet>",
  "planoId": "<id-do-plano>",
  "quantidadeRacaoKg": 5,
  "consumoDiarioEstimadoG": 300
}
```

`quantidadeRacaoKg` deve ser maior que zero e
`consumoDiarioEstimadoG` deve ser pelo menos 1. O servidor define a previsão
da próxima entrega a partir da quantidade de ração e do consumo diário
informados. A criação verifica que o pet pertence ao tutor e que o plano
existe; o ID do plano é validado antes de criar a assinatura.

As respostas de consulta incluem os dados relacionados do pet e do plano. O
O `PATCH` aceita parcialmente `planoId`, `quantidadeRacaoKg` e
`consumoDiarioEstimadoG`; o `petId` e o `status` não podem ser alterados por
essa rota. As transições de status usam as operações próprias acima. Ao mudar a
quantidade ou o consumo diário, o servidor recalcula a previsão da próxima
entrega. O cancelamento é lógico: o registro permanece armazenado.

Uma assinatura cancelada não pode ser pausada nem retomada.

## Autorização

Envie `Authorization: Bearer <accessToken>` em todas as rotas. A busca,
atualização e exclusão são limitadas ao tutor do token.

Onde estamos: Bloco 2 · Passo A de 6 concluído (commit pendente de autorização).
