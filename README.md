# ZeloPets

ZeloPets conecta tutores de cães a serviços de mobilidade, hospedagem e
nutrição, com perfil digital do cão e recomendações por K-Means.

## Requisitos

- Node.js e pnpm compatíveis com as versões fixadas no projeto.
- Python 3 e pip para o microsserviço de recomendações.
- Acesso a um banco PostgreSQL configurado em `DATABASE_URL`.

Crie um `.env` local na raiz com as variáveis `DATABASE_URL` e `JWT_SECRET`.
Não compartilhe esse arquivo. O frontend usa `http://localhost:3000` por
padrão; se necessário, defina `VITE_API_URL` no ambiente do Vite.

## Instalação e banco

Na raiz do repositório:

```powershell
pnpm install
pnpm exec prisma migrate deploy
```

O comando de migração aplica as migrations pendentes sem recriar o banco.
Para popular o catálogo e a conta de demonstração no banco configurado, rode
explicitamente:

```powershell
pnpm exec prisma db seed
```

O seed cria pacotes e planos quando suas tabelas estão vazias. A conta demo
usa um saldo inicial de ZeloCoins para demonstração. Não rode o seed contra um
banco compartilhado sem confirmar que os dados adicionais são esperados.

## Iniciar os serviços

Abra terminais separados na raiz do repositório.

**API NestJS (porta 3000):**

```powershell
pnpm start:dev
```

Swagger: `http://localhost:3000/docs`.

**Frontend React + Vite (porta 5173):**

```powershell
pnpm --dir frontend dev
```

**Microsserviço Python de recomendações (porta 8000):**

```powershell
cd ml-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --app-dir app --reload --port 8000
```

Verifique `http://localhost:8000/health`. A rota
`/recommend/{user_id}` retorna recomendações com o modelo disponível; o
microsserviço consulta o banco configurado em `DATABASE_URL`. O treino do
modelo é uma operação separada e não é necessário para iniciar o restante do
app.

## Demonstração

Após criar/popular o banco com o seed:

- E-mail: `demo@zelopets.com.br`
- Senha: `demo1234`
- Pet de demonstração: Bento.

O seed não duplica a conta demo; quando ela já existe, atualiza apenas seu
saldo de demonstração. As rotas de tutor e agenda requerem autenticação JWT.

## Mapa de telas

- **Login / cadastro:** entrada e registro de tutor.
- **Cadastro do cão:** primeiro passo quando a conta ainda não tem cães.
- **Início:** saudação, seletor do cão ativo, próximo cuidado, Mobilidade,
  Hotel ZeloPets, Nutrição e atalho do Zelinho.
- **Agenda:** próximos cuidados do tutor.
- **Zelinho:** tela provisória de atendimento.
- **Perfil:** dados do tutor e cães cadastrados.
- **Carteira:** saldo atual de ZeloCoins; histórico e regras de acúmulo ainda
  estão em construção.
- **Telas de serviço:** placeholders para Mobilidade, Hotel e Nutrição.

## Verificações

```powershell
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm --dir frontend build
pnpm --dir frontend exec tsc --noEmit
```
