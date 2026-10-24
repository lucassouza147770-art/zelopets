# CRUD de passeios

O recurso `passeios` agenda passeios para pets do tutor autenticado. Todas as rotas exigem JWT. A criação valida que o pet pertence ao tutor do token; o tutor não é informado no corpo da requisição.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/passeios` | Cria um passeio para um pet do tutor autenticado. |
| `GET` | `/passeios` | Lista os passeios do tutor por data e hora crescentes. |
| `GET` | `/passeios/proximo` | Retorna o próximo passeio futuro pendente ou confirmado. |
| `GET` | `/passeios/:id` | Retorna um passeio do tutor. |
| `PATCH` | `/passeios/:id` | Atualiza os dados ou o status do passeio. |
| `DELETE` | `/passeios/:id` | Cancela o passeio, definindo o status como `CANCELADO`. |

## Criar passeio

Envie `Authorization: Bearer <token>` e um corpo como:

```json
{
  "petId": "<id-do-pet-do-tutor>",
  "dataHora": "2030-06-15T14:00:00.000Z",
  "duracaoMinutos": 45
}
```

`petId` e `dataHora` são obrigatórios. `prestadorId` e `duracaoMinutos` são
opcionais; a duração padrão é 30 minutos. São aceitas somente durações de 30,
45 ou 60 minutos, com preços calculados pelo servidor de R$ 25, R$ 35 e R$ 45,
respectivamente. O corpo não aceita informar o preço.

O `PATCH` permite alterar `prestadorId`, `dataHora`, `duracaoMinutos` e
`status`, mas não permite trocar o `petId`. Ao alterar a duração, o servidor
recalcula o preço. O tutor pode alterar o próprio `status`; regras de transição
entre status ficam para uma etapa futura.

## Verificar o próximo passeio

1. Faça login em `POST /auth/login` e use o token JWT.
2. Crie um passeio em `POST /passeios` com um `petId` pertencente ao tutor e uma `dataHora` futura.
3. Consulte `GET /passeios/proximo` com o mesmo token e confirme que a resposta contém o passeio criado.

`/proximo` é registrada antes de `/:id` no controlador para que a rota estática não seja interpretada como um identificador.

Onde estamos: Bloco 2 · Passo A de 6 concluído (commit pendente de autorização).