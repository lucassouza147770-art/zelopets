# Dados de demonstracao do modelo de recomendacao

## Natureza dos registros

**ESTES SÃO DADOS DE DEMONSTRAÇÃO GERADOS POR SEED; NÃO SÃO USUÁRIOS NEM PETS
REAIS.** Os oito tutores usam e-mails terminados em
`@demo.zelopets.local`, senha de demonstração `demo1234` e saldo zero de
ZeloCoins. A seed cria 48 cães e seis prestadores identificados como
demonstração.

Os cães são distribuídos em quatro perfis deliberadamente estruturados:

- pequeno e calmo: porte pequeno, energia baixa, 3–9 kg, Shih Tzu ou Poodle,
  comportamentos medroso e ansioso, aproximadamente 6–12 anos;
- médio e sociável: porte médio, energia média, 10–20 kg, Vira-lata ou
  Bulldog, comportamento sociável, aproximadamente 2–7 anos;
- grande e enérgico: porte grande, energia alta, 25–40 kg, Labrador ou Golden
  Retriever, comportamentos brincalhão e sociável, aproximadamente 1–5 anos;
- médio, alérgico e tranquilo: porte médio, energia baixa, restrição a frango
  ou glúten e comportamento calmo.

Uma rotina pseudoaleatória local com semente fixa introduz variação
reproduzível dentro dos perfis sem substituir `Math.random` globalmente. As
datas de nascimento são geradas a partir de uma data de referência fixa para
que as idades também sejam repetíveis. A seed cria quatro passeadores e dois
hotéis com combinações variadas de portes e energias atendidos e avaliações
entre 4,0 e 5,0.

## Execução segura

Na raiz do repositório:

```powershell
pnpm exec ts-node prisma/seed-ml.ts
```

A operação é idempotente: usa identificadores estáveis e atualiza somente os
registros identificados como demonstração. A flag opcional `--limpar` remove
somente os pets associados a tutores cujo e-mail termina em
`@demo.zelopets.local` e esses tutores. Ela não remove outros usuários, pets,
prestadores ou dados do banco.

Treine o modelo a partir da pasta real da aplicação Python:

```powershell
Set-Location ml-service/app
..\.venv\Scripts\python.exe train.py
```

O modelo consulta a tabela de pets do banco. Registros seedados participam do
treino como linhas do banco, mas sua natureza continua sendo sintética e de
demonstração. Se houver menos de 20 pets no total, o script existente usa
dados simulados apenas para validar a pipeline; não interprete esse resultado
como treino com dados reais.

## Resultado da execução de validação

Na execução registrada para este checkpoint, o treinamento leu 50 registros
do banco (48 de demonstração e dois registros preexistentes), portanto a fonte
reportada pelo script foi `banco real`. Após adicionar imputação mediana
ajustada no treino, o Silhouette Score máximo escolheu `K=8`, com score
`0,533`. Os tamanhos dos clusters foram:

| Cluster | Pets |
| --- | ---: |
| 0 | 12 |
| 1 | 5 |
| 2 | 6 |
| 3 | 6 |
| 4 | 6 |
| 5 | 7 |
| 6 | 6 |
| 7 | 2 |

O score mede a separação desta amostra, que contém dados de demonstração
estruturados; não é evidência de qualidade preditiva para usuários reais. O
notebook `ml-service/notebooks/justificativa_k.ipynb` documenta a escolha de K
e a composição agregada dos clusters sem exibir linhas individuais de pets.
Suas células foram reexecutadas e incluem os resultados e o grafico atualizados.

## Dados opcionais e imputacao (G2)

O formulario de cadastro pode enviar raça, peso, data de nascimento,
restricoes alimentares e comportamento. A selecao de retrato ("com quem seu
pet mais se parece?") continua independente e nao e tratada como raça. O DTO
valida os campos, o servico os persiste e `GET /pets` devolve os dados de
perfil completos.

Peso e idade ausentes permanecem como valores ausentes na tabela de features.
O pipeline do K-Means aprende as medianas somente nos dados de treino e salva
esse imputador junto com o modelo para reutiliza-lo na inferencia. Nesta
execucao, as medianas de treino foram 14,6 kg e 5,7 anos. No cluster com dois
pets, um peso e duas idades foram imputados; a tabela do notebook marca esses
valores, em vez de apresenta-los como observacoes reais ou como zero. O modelo
recebe a versao 2 do pipeline e a API rejeita artefatos anteriores ate o
retreino.

Onde estamos: Bloco 2 · correção G2 implementada e validada localmente; commit
pendente do fechamento do G1 (Passo F).
