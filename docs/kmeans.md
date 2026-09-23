# Pipeline K-Means

## Estrutura

O microsservico fica em `ml-service/`:

- `app/features.py`: transforma os pets em features numericas.
- `app/train.py`: carrega dados, treina o K-Means e gera os entregaveis.
- `app/main.py`: expoe `/health` e reserva `/recommend/{user_id}`.
- `notebooks/justificativa_k.ipynb`: registra a justificativa metodologica.

## Features

### Variaveis categoricas

`porte`, `nivelEnergia` e `raca` usam One-Hot Encoding. Essas variaveis nao
possuem uma ordem numerica confiavel: tratar `GRANDE` como maior que `MEDIO`,
por exemplo, criaria uma distancia artificial. O encoder tambem usa
`handle_unknown="ignore"` para que uma categoria nova nao quebre a inferencia.

### Variaveis numericas

`pesoKg` e a idade calculada a partir de `dataNascimento` usam StandardScaler.
O K-Means usa distancia, entao a padronizacao impede que uma feature com
unidade ou amplitude maior domine o agrupamento.

### Listas de caracteristicas

`restricoesAlimentares` e `comportamento` aceitam varios valores por pet. Cada
item vira uma coluna binaria via MultiLabelBinarizer. Isso preserva a presenca
de cada caracteristica sem impor ordem entre tags e sem aplicar uma escala
inadequada a indicadores 0/1.

## Treino

`train.py` tenta ler os pets reais da tabela `Pet` usando `DATABASE_URL`. Com
menos de 20 registros, usa um dataset deterministico simulado com seed 42,
apenas para validar a pipeline. O modelo final deve ser regenerado com pets
reais antes da entrega.

O treino calcula inercia e Silhouette Score para `K` de 2 a 10, salva
`app/elbow_e_silhouette.png` e grava `app/modelo_kmeans.joblib` com o pipeline,
o modelo e a fonte dos dados.

## API e pendencias

`GET /health` informa se o modelo foi carregado. O endpoint
`GET /recommend/{user_id}` permanece `501 Not Implemented` porque a busca de
prestadores proximos ao centroide depende da tabela `Prestador`, ainda nao
criada no schema.

Link para o e-mail de aprovacao do professor: **inserir aqui o link compartilhado pela equipe**.
