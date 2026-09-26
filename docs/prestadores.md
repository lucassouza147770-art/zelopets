# CRUD de prestadores

O recurso `prestadores` representa passeadores e hotéis disponíveis para recomendação. A leitura é pública e retorna apenas registros ativos. A escrita exige um token JWT; até existir um papel de administrador, qualquer tutor autenticado pode executar essas operações.

## Endpoints

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/prestadores` | Pública | Lista prestadores ativos, ordenados por `avaliacaoMedia` decrescente. |
| `GET` | `/prestadores?tipo=PASSEADOR` | Pública | Filtra por `PASSEADOR` ou `HOTEL`. |
| `GET` | `/prestadores/:id` | Pública | Retorna um prestador ativo. |
| `POST` | `/prestadores` | Bearer JWT | Cria um prestador. |
| `PATCH` | `/prestadores/:id` | Bearer JWT | Atualiza os dados de um prestador ativo. |
| `DELETE` | `/prestadores/:id` | Bearer JWT | Faz soft-delete, alterando `ativo` para `false`. |

## Corpo de criação/atualização

```json
{
  "nome": "Passeios do Nico",
  "tipo": "PASSEADOR",
  "bio": "Passeios individuais e em pequenos grupos.",
  "experienciaAnos": 5,
  "portesAtendidos": ["PEQUENO", "MEDIO"],
  "niveisEnergiaAtendidos": ["BAIXO", "MEDIO"],
  "fotoUrl": "https://exemplo.com/passeador.jpg"
}
```

`nome` e `tipo` são obrigatórios. `tipo` aceita somente `PASSEADOR` e `HOTEL`; `experienciaAnos` deve ser um inteiro maior ou igual a zero. `portesAtendidos` aceita `PEQUENO`, `MEDIO` e `GRANDE`; `niveisEnergiaAtendidos` aceita `BAIXO`, `MEDIO` e `ALTO`. Os dois arrays são opcionais e começam vazios.

## Teste rápido

1. Faça login em `POST /auth/login` e copie o JWT.
2. Envie dois ou três `POST /prestadores` com `Authorization: Bearer <token>`.
3. Consulte `GET /prestadores` sem o header `Authorization` e confirme que os registros aparecem.
4. Envie `DELETE` em um registro autenticado e confirme que ele não aparece mais na listagem, mas continua no banco com `ativo = false`.