# Catálogo de hospedagem e nutrição

O catálogo expõe os pacotes de hospedagem e os planos nutricionais disponíveis
para consulta. As rotas são públicas e não exigem token.

## Endpoints

| Método | Rota | Ordenação |
| --- | --- | --- |
| `GET` | `/pacotes-hospedagem` | Preço diário crescente. |
| `GET` | `/planos-nutricionais` | Preço mensal crescente. |

Cada rota retorna uma lista de registros com seus identificadores, nomes,
descrições e valores. Pacotes incluem `precoDiaria`, `nivelConvivencia` e
`nivelContato`. Planos incluem `precoMensal` e `tipoDieta`.

Os identificadores retornados são usados ao criar hospedagens
(`pacoteId`) e assinaturas (`planoId`). O catálogo não implementa neste momento
filtros, paginação, criação ou edição pela API.

## Dados de demonstração

O seed cria pacotes e planos apenas quando a tabela correspondente está vazia.
Os valores de demonstração são:

| Tipo | Nome | Preço |
| --- | --- | ---: |
| Pacote | Essencial | R$ 60 por diária |
| Pacote | Conforto | R$ 90 por diária |
| Pacote | Premium | R$ 140 por diária |
| Plano | Natural Balanceado | R$ 120 por mês |
| Plano | Premium Performance | R$ 180 por mês |
| Plano | Hipoalergênico | R$ 160 por mês |

Esses registros servem para demonstração e não configuram uma regra de preço
dinâmica ou política comercial.

Onde estamos: checkpoint CRUDs + Swagger + seed (commit pendente de autorização).
