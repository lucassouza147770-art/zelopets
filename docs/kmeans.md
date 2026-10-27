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

`pesoKg` e a idade calculada a partir de `dataNascimento` usam imputacao
mediana ajustada somente no conjunto de treino, seguida por StandardScaler.
Ausencias permanecem como NaN ate a transformacao; nao sao convertidas em
zero. O mesmo imputador salvo no modelo e aplicado durante a inferencia. Se
uma feature numerica estiver totalmente ausente no treino, o treinamento falha
com uma mensagem explicita em vez de inventar uma mediana.

O K-Means usa distancia, entao a padronizacao impede que uma feature com
unidade ou amplitude maior domine o agrupamento.

### Listas de caracteristicas

`restricoesAlimentares` e `comportamento` aceitam varios valores por pet. Cada
item vira uma coluna binaria via MultiLabelBinarizer. Isso preserva a presenca
de cada caracteristica sem impor ordem entre tags e sem aplicar uma escala
inadequada a indicadores 0/1.

## Treino

`train.py` tenta ler os pets da tabela `Pet` usando `DATABASE_URL`. Com menos
de 20 registros, usa um dataset deterministico simulado com seed 42, incluindo
idades e pesos para validar o tratamento numerico. O artefato guarda a versao
do pipeline de features; a API rejeita modelos anteriores a essa versao ate
que o retreino seja feito.

O treino calcula inercia e Silhouette Score para `K` de 2 a 10, salva
`app/elbow_e_silhouette.png` e grava `app/modelo_kmeans.joblib` com o
imputador, o restante do pipeline, o modelo e a fonte dos dados.

## API de recomendacao

`GET /health` informa se o modelo foi carregado. O endpoint
`GET /recommend/{user_id}` exige o token interno e, opcionalmente, `pet_id`.
Ao receber o identificador, confirma que o pet pertence ao tutor antes da
inferencia; sem identificador, usa o primeiro pet desse tutor. O resultado
inclui o cluster e os prestadores ativos compatíveis ordenados por avaliacao.

Na reexecucao com 50 registros de demonstracao e preexistentes, a maior
Silhouette foi `0,533` em `K=8`; `K=4` ficou em `0,512`. Os dados sinteticos
foram definidos em quatro perfis, por isso K=8 descreve subdivisoes desta
amostra e nao uma descoberta de oito segmentos reais.

Link para o e-mail de aprovacao do professor: **inserir aqui o link compartilhado pela equipe**.
