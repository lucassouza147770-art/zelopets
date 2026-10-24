# Perfil do tutor e agenda

## Perfil do tutor autenticado

`GET /tutores/me` exige JWT e busca o tutor identificado pelo token. A resposta
contém apenas `id`, `nome`, `email` e `zeloCoins`; `senhaHash` nunca é
selecionado nem devolvido. Se o tutor não existir, a API retorna `404`.

## Próximo cuidado

`GET /agenda/proximo` exige JWT e responde sempre com o invólucro
`{ "proximo": ... }`. Sem cuidados futuros elegíveis, `proximo` é `null`.
Quando existe um resultado, o formato é:

```json
{
  "proximo": {
    "tipo": "PASSEIO",
    "petNome": "Bento",
    "dataHora": "2030-06-15T14:00:00.000Z",
    "status": "PENDENTE"
  }
}
```

O serviço compara os próximos passeios pendentes ou confirmados pela data e
hora, hospedagens pendentes ou confirmadas pelo check-in e assinaturas
nutricionais ativas pela previsão da próxima entrega. Apenas registros do
tutor autenticado são considerados. O resultado é o cuidado elegível de data
mais próxima no futuro.

## Lista da agenda

`GET /agenda` exige JWT e retorna uma lista dos mesmos tipos de cuidado,
ordenada pela data crescente. Os objetos usam `tipo` (`PASSEIO`, `HOSPEDAGEM`
ou `NUTRICAO`), `petNome`, `dataHora` e `status`. A lista pode estar vazia.

## Saldo de demonstração

O saldo `zeloCoins` tem valor padrão zero no modelo do tutor. O seed define 1.250 moedas para a conta demo, tanto ao criá-la quanto ao
atualizar uma conta demo já existente. Esse número é apenas um dado de
demonstração, não uma regra de negócio nem uma regra de acúmulo.

Onde estamos: Fase 2 — Home final · Passo 1 de 5 concluído (commit pendente de autorização).
