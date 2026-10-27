# Recomendação de prestadores

O microsserviço `ml-service` oferece recomendações de passeadores e hotéis com base nos perfis de pets e clusters K-Means.

## Preparação

1. Instale as dependências com `python -m pip install -r ml-service/requirements.txt`.
2. Garanta que `DATABASE_URL` esteja disponível no ambiente ou no `.env` da raiz.
3. Aplique as migrations Prisma, incluindo `prestador_perfil_atendimento`.
4. Treine o modelo a partir da raiz do repositório com `python ml-service/app/train.py`.

O treinamento lê pets do PostgreSQL. Com menos de 20 pets, usa dados simulados para validar a pipeline; nesse caso, retreine quando houver dados reais antes de considerar as recomendações representativas. O arquivo gerado é `ml-service/app/modelo_kmeans.joblib` e não é versionado.

## Endpoint

`GET /recommend/{user_id}?pet_id=<id-do-pet>`

O `user_id` é o ID do tutor. O parâmetro opcional `pet_id` seleciona um pet;
o serviço verifica que ele pertence ao tutor e responde `404` quando não
pertence. Sem `pet_id`, usa o primeiro pet do tutor, ordenado pela criação.
Aplica o mesmo `ColumnTransformer` e os mesmos `MultiLabelBinarizers` salvos
no treino, prevê o cluster e decodifica porte, energia e raça representativos
do centroide. Em seguida busca prestadores ativos, recomenda os que atendem ao
porte **ou** ao nível de energia do perfil do cluster, ordena por
`avaliacaoMedia` decrescente e retorna até cinco.

Todas as chamadas de `/recommend/{user_id}` exigem o cabeçalho
`X-Internal-Token`, cujo valor deve corresponder a `ML_INTERNAL_TOKEN` no
ambiente do serviço. A rota `/health` permanece pública. Se o token não estiver
configurado, a recomendação responde `503`; token ausente ou inválido responde
`401`. Nunca registre nem exponha o valor do token.

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
  "prestadoresRecomendados": [
    {
      "id": "uuid-do-prestador",
      "nome": "Nome do prestador",
      "tipo": "PASSEADOR",
      "avaliacaoMedia": 4.8,
      "portesAtendidos": ["GRANDE"],
      "niveisEnergiaAtendidos": ["ALTO"]
    }
  ],
  "prestadoresRecomendadosIds": ["uuid-do-prestador"]
}
```

`prestadoresRecomendadosIds` contém os IDs na mesma ordem dos objetos em
`prestadoresRecomendados`; os campos de resposta existentes são mantidos para
compatibilidade. O endpoint responde `404` quando o tutor não tem pets ou o
pet selecionado não pertence a ele, e `503` quando o modelo está ausente ou foi
treinado no formato antigo sem `binarizadores`; rode novamente o comando de
treino após qualquer mudança na estrutura do artefato.

## Perfil dos prestadores

Crie prestadores com `portesAtendidos` e/ou `niveisEnergiaAtendidos` preenchidos pela API NestJS (`POST /prestadores`, autenticado). Os campos são arrays de enums e têm default vazio. Sem nenhum valor compatível, o prestador não aparece na lista recomendada. O filtro usa OR para aceitar compatibilidade em uma das duas dimensões.

## Execução local

Na pasta `ml-service/app`, inicie a API com
`python -m uvicorn main:app --reload --port 8000`. Configure
`ML_INTERNAL_TOKEN` e `DATABASE_URL` no ambiente ou no `.env` da raiz; não
inclua valores secretos em logs ou documentação. `GET /health` informa se o
modelo foi carregado e não requer token.

Onde estamos: Bloco 2 · Passo C de 6 concluído (commit pendente de autorização).