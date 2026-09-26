# Recomendação de prestadores

O microsserviço `ml-service` oferece recomendações de passeadores e hotéis com base nos perfis de pets e clusters K-Means.

## Preparação

1. Instale as dependências com `python -m pip install -r ml-service/requirements.txt`.
2. Garanta que `DATABASE_URL` esteja disponível no ambiente ou no `.env` da raiz.
3. Aplique as migrations Prisma, incluindo `prestador_perfil_atendimento`.
4. Treine o modelo a partir da raiz do repositório com `python ml-service/app/train.py`.

O treinamento lê pets do PostgreSQL. Com menos de 20 pets, usa dados simulados para validar a pipeline; nesse caso, retreine quando houver dados reais antes de considerar as recomendações representativas. O arquivo gerado é `ml-service/app/modelo_kmeans.joblib` e não é versionado.

## Endpoint

`GET /recommend/{user_id}`

O `user_id` é o ID do tutor. O serviço busca os pets desse tutor, usa o primeiro (ordenado pela criação), aplica o mesmo `ColumnTransformer` e os mesmos `MultiLabelBinarizers` salvos no treino, prevê o cluster e decodifica porte, energia e raça representativos do centroide. Em seguida busca prestadores ativos, recomenda os que atendem ao porte **ou** ao nível de energia do perfil do cluster, ordena por `avaliacaoMedia` decrescente e retorna até cinco.

Exemplo de resposta:

```json
{
  "petId": "uuid-do-pet",
  "cluster": 2,
  "perfilDoCluster": {
    "porte": "GRANDE",
    "nivel_energia": "ALTO",
    "raca": "Labrador"
  },
  "prestadoresRecomendados": []
}
```

O endpoint responde `404` quando o tutor não tem pets e `503` quando o modelo está ausente ou foi treinado no formato antigo sem `binarizadores`; rode novamente o comando de treino após qualquer mudança na estrutura do artefato.

## Perfil dos prestadores

Crie prestadores com `portesAtendidos` e/ou `niveisEnergiaAtendidos` preenchidos pela API NestJS (`POST /prestadores`, autenticado). Os campos são arrays de enums e têm default vazio. Sem nenhum valor compatível, o prestador não aparece na lista recomendada. O filtro usa OR para aceitar compatibilidade em uma das duas dimensões.

## Execução local

Na pasta `ml-service/app`, inicie a API com `python -m uvicorn main:app --reload --port 8000`. `GET /health` informa se o modelo foi carregado. A raiz do projeto deve conter `.env` com a conexão ao banco.