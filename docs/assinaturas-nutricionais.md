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
| `PATCH` | `/assinaturas-nutricionais/:id` | Atualiza dados da assinatura ou seu status. |
| `DELETE` | `/assinaturas-nutricionais/:id` | Cancela a assinatura, definindo o status como `CANCELADA`. |

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
`PATCH` aceita parcialmente os campos de criação e um `status` de
`StatusAssinatura` (`ATIVA`, `PAUSADA` ou `CANCELADA`). O cancelamento é lógico:
o registro permanece armazenado.

## Autorização

Envie `Authorization: Bearer <accessToken>` em todas as rotas. A busca,
atualização e exclusão são limitadas ao tutor do token.

Onde estamos: checkpoint CRUDs + Swagger + seed (commit pendente de autorização).
