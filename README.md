# ZeloPets

ZeloPets conecta tutores de cães a serviços de mobilidade, hospedagem e
nutrição, com perfil digital do cão e recomendações por K-Means.

## Requisitos

- Node.js e pnpm compatíveis com as versões fixadas no projeto.
- Python 3 e pip para o microsserviço de recomendações.
- Acesso a um banco PostgreSQL configurado em `DATABASE_URL`.

Crie um `.env` local na raiz a partir de `.env.example`. Configure
`DATABASE_URL`, `JWT_SECRET`, `ML_SERVICE_URL` e `ML_INTERNAL_TOKEN`; use o
mesmo valor local de `ML_INTERNAL_TOKEN` na API NestJS e no `ml-service`.
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
app. A rota `/recommend/{user_id}` exige `X-Internal-Token`; `/health`
permanece pública.

## Dados de demonstração para recomendações

Os perfis ML são **dados de demonstração gerados por seed, não usuários ou
pets reais**. Para criar os oito tutores, 48 cães e seis prestadores de
demonstração no banco configurado, rode explicitamente:

```powershell
pnpm exec ts-node prisma/seed-ml.ts
```

O comando é idempotente e `--limpar` remove somente os tutores com e-mail
terminado em `@demo.zelopets.local` e os pets associados. Não resete um banco
compartilhado. Os logins gerados são `demo01@demo.zelopets.local` até
`demo08@demo.zelopets.local`, todos com senha `demo1234`.

Para treinar o modelo com os pets do banco, na pasta `ml-service/app`:

```powershell
..\.venv\Scripts\python.exe train.py
```

O resultado depende da composição atual do banco. A fonte `banco real`
significa que as linhas foram consultadas no PostgreSQL; não transforma os
registros de demonstração em dados de usuários reais. Consulte
[`docs/dados-demonstracao-ml.md`](./docs/dados-demonstracao-ml.md) para os
detalhes e resultados registrados.

## Recursos visuais

O frontend inclui o pacote visual de protótipo em
[`frontend/public/assets/`](./frontend/public/assets/), com fotos geradas por
IA e ícones SVG originais. O primeiro uso está no hero interativo da home
autenticada; consulte [`docs/recursos-visuais.md`](./docs/recursos-visuais.md)
antes de reutilizar as imagens em cards de serviços.

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
- **Mobilidade:** recomendações de passeadores para o cão ativo e formulário
  para agendar passeios.
- **Agenda:** próximos cuidados do tutor.
- **Zelinho:** classificador local de dúvidas sobre os serviços; integração LLM aguarda chave.
- **Gêmeo Digital:** perfil visual baseado nos dados cadastrados do pet e nas recomendações disponíveis.
- **Perfil:** dados do tutor e cães cadastrados.
- **Carteira:** saldo atual de ZeloCoins; histórico e regras de acúmulo ainda
  estão em construção.
- **Telas de serviço:** Hotel e Nutrição continuam como placeholders de interface.

As limitações deliberadas de escopo estão em
[`docs/limitacoes.md`](./docs/limitacoes.md).

## Verificações

```powershell
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm --dir frontend build
pnpm --dir frontend exec tsc --noEmit
Push-Location ml-service
try { .\.venv\Scripts\python.exe -m pytest } finally { Pop-Location }
```
