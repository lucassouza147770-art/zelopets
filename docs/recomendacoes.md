# Endpoint de recomendações

## Fluxo

```text
Frontend → NestJS (/recomendacoes) → FastAPI (/recommend) → PostgreSQL
                    │                      │
                    └── busca prestadores ─┘
```

O frontend chama apenas o endpoint autenticado do Nest. O Nest extrai o
`tutorId` do JWT, escolhe o pet mais antigo quando `petId` não é informado ou
valida a propriedade do pet selecionado, e consulta o microsserviço com
`pet_id`. Depois busca os prestadores ativos no Prisma e mantém a ordem dos
IDs devolvidos pelo modelo. Assim, o token interno do serviço ML não é
distribuído ao navegador, e a autorização e o acesso ao banco continuam
centralizados no backend.

## Endpoint Nest

`GET /recomendacoes?petId=<id-opcional>` exige `Authorization: Bearer <JWT>`.
Sem `petId`, o primeiro pet cadastrado do tutor é usado. Um pet que não
pertença ao tutor retorna `404`.

Exemplo de resposta:

```json
{
  "cluster": 2,
  "perfilDoCluster": {
    "porte": "MEDIO",
    "nivel_energia": "ALTO",
    "raca": "Labrador"
  },
  "prestadores": [
    {
      "id": "uuid-do-prestador",
      "nome": "Nome do prestador",
      "tipo": "PASSEADOR",
      "avaliacaoMedia": 4.8,
      "experienciaAnos": 5,
      "motivo": "Atende cães de porte médio e de energia alta"
    }
  ]
}
```

O `motivo` descreve quais dimensões do perfil do cluster realmente
correspondem às listas de atendimento do prestador. Erros de conexão, timeout
de três segundos, modelo ausente ou resposta inválida do ML retornam `503`
com a mensagem `Recomendações indisponíveis no momento`.

## Configuração

No `.env` da raiz configure `ML_SERVICE_URL` (padrão
`http://127.0.0.1:8000`) e `ML_INTERNAL_TOKEN`. O mesmo token deve estar em
`ML_INTERNAL_TOKEN` no ambiente do `ml-service`. Não coloque o segredo no
frontend nem em logs. O arquivo `.env.example` contém somente nomes de
variáveis e valores não secretos.

Onde estamos: Bloco 2 · Passo D de 6 concluído (commit pendente de autorização).
