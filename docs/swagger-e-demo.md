# Swagger e ambiente de demonstração

## Abrir a documentação da API

Com as dependências instaladas e a configuração local do banco disponível,
inicie a API na raiz do projeto:

```powershell
pnpm start:dev
```

Por padrão, a API escuta na porta `3000` (ou na porta definida pela variável
`PORT`). Abra `http://localhost:3000/docs` para explorar e testar as rotas no
Swagger. Os endpoints protegidos usam autenticação Bearer.

## Login de demonstração

O seed define a conta abaixo quando ainda não existe um tutor com esse e-mail:

- E-mail: `demo@zelopets.com.br`
- Senha: `demo1234`

Faça `POST /auth/login` com:

```json
{
  "email": "demo@zelopets.com.br",
  "senha": "demo1234"
}
```

A resposta tem o formato:

```json
{
  "accessToken": "<token-jwt>"
}
```

No Swagger, clique em **Authorize** e informe `Bearer <accessToken>` para
testar as rotas protegidas, como `GET /pets`, `/passeios` e
`/assinaturas-nutricionais`. Não compartilhe esse token.

## Roteiro de demonstração

1. Faça login com a conta demo.
2. Consulte `GET /pets` e copie o ID do cão de demonstração.
3. Consulte `GET /pacotes-hospedagem`, `GET /planos-nutricionais` e
   `GET /prestadores` para obter IDs válidos.
4. Consulte ou crie um passeio em `POST /passeios`, informando o pet, uma data
   ISO futura e um valor não negativo.
5. Crie uma hospedagem em `POST /hospedagens`, com pacote, pet e datas em que
   o check-out seja posterior ao check-in. O valor total é calculado pelo
   servidor.
6. Crie uma assinatura em `POST /assinaturas-nutricionais`, com plano, pet,
   quantidade de ração e consumo diário.
7. Consulte as listas para conferir os registros e suas relações.

## Executar o seed

O seed precisa de `DATABASE_URL` configurada localmente. Para executá-lo:

```powershell
pnpm exec prisma db seed
```

O script cria os itens do catálogo somente se cada tabela estiver vazia. Se a
conta demo já existir, ele não cria outra conta, pet ou prestadores demo.
Execute apenas contra o banco apropriado para demonstração; este comando
escreve dados no banco configurado.

Onde estamos: checkpoint CRUDs + Swagger + seed (commit pendente de autorização).
