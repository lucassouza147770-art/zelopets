# Validação do Bloco 2

## Revalidacao atual do Passo F (24/10/2026)

### Axe

- Home logada — `http://127.0.0.1:5173/`, estado Home: axe-core 4.10.3,
  0 violacoes, 30 verificacoes aprovadas, 0 incompletas.
- Mobilidade logada — `http://127.0.0.1:5173/`, estado Mobilidade: axe-core
  4.10.3, 0 violacoes, 30 verificacoes aprovadas, 0 incompletas.

### Lighthouse Snapshot

- Home logada e Mobilidade foram tentadas no mesmo URL local e nos estados
  acima. A execucao do Lighthouse Snapshot no Chrome local ficou sem resposta
  e foi interrompida. Uma nova tentativa com Chrome headless nao alcançou o
  estado autenticado antes do timeout, portanto nao gerou Snapshot. Nao ha
  notas para reportar; nenhuma nota foi estimada nem substituida por outra
  modalidade de auditoria.

### Fluxo por teclado

- Tab/Enter percorreu Home -> Mobilidade -> Agenda -> Home. Na tela Mobilidade,
  Tab percorreu os recomendados, o campo de data/hora, as duracoes e a
  navegacao. Espaco selecionou 45 min (estimativa R$ 35) em uma rodada
  anterior; nao houve foco preso durante essa sequencia.
- O `<main>` recebe foco ao abrir uma rota. O campo nativo `datetime-local`
  continua aceitando foco, mas a digitacao automatizada (inclusive a tentativa
  por digitos) nao preencheu uma data. Assim, nao foi possivel confirmar o
  envio de uma reserva por teclado; o fluxo completo de reserva nao esta
  validado. Nenhum passeio foi enviado nesta revalidacao.

### Notebook e dados

- A correção G2 agora envia os campos opcionais do cadastro para a API e
  imputa valores numéricos ausentes pela mediana ajustada somente no treino.
  O artefato v2 salvo foi treinado com 50 pets do banco (48 seedados e dois
  preexistentes); as medianas foram 14,6 kg e 5,7 anos.
- O notebook foi reexecutado; as células de código têm contagens 1, 2 e 3,
  outputs atualizados e gráfico incorporado. Silhouette: K=2 0,410; K=3
  0,488; K=4 0,512; K=5 0,514; K=6 0,497; K=7 0,518; K=8 0,533; K=9 0,507;
  K=10 0,502.
- O melhor score observado é K=8 (0,533); K=4 (0,512) fica 0,021 abaixo.
  A conclusão do notebook não interpreta os quatro perfis de seed como grupos
  descobertos nos dados.
- Perfis decodificados do K=8:
  - Cluster 0 (12): pequeno, energia baixa, poodle; 6,3 kg, 8,8 anos;
    ansiosos e medrosos; sem restrições.
  - Cluster 1 (5): médio, energia média, vira-lata; 14,1 kg, 4,7 anos;
    sociáveis; sem restrições.
  - Cluster 2 (6): grande, energia alta, labrador; 30,2 kg, 3,8 anos;
    brincalhões e sociáveis; sem restrições.
  - Cluster 3 (6): médio, energia baixa, vira-lata; 14,2 kg, 7,8 anos;
    calmos; alergia a frango/sem glúten.
  - Cluster 4 (6): médio, energia baixa, bulldog; 15,4 kg, 5,2 anos;
    calmos; alergia a frango/sem glúten.
  - Cluster 5 (7): médio, energia média, bulldog; 12,7 kg, 5,1 anos;
    sociáveis; sem restrições.
  - Cluster 6 (6): grande, energia alta, golden retriever; 29,9 kg, 2,7 anos;
    brincalhões e sociáveis; sem restrições.
  - Cluster 7 (2): médio, energia alta, labrador; mediana perfilada 16,3 kg e
    5,7 anos; 1 peso e 2 idades imputados; sociável/brincalhão; sem restrições.

### Revisao e estado

- `../revisao-bloco2.txt` foi gerado com 11 arquivos e cabecalhos
  `=== caminho ===`, conforme a lista solicitada.
- `.env.example` contem apenas placeholders vazios para DATABASE_URL,
  JWT_SECRET e ML_INTERNAL_TOKEN; `ML_SERVICE_URL` aponta para loopback. Nenhum
  valor secreto foi encontrado.
- A auditoria Lighthouse Snapshot e a confirmacao final por teclado ficam sob
  validacao do dono e nao bloqueiam o fechamento deste gate. As tentativas
  locais nao geraram notas nem confirmaram o envio de uma reserva; nenhum novo
  passeio foi criado nesta revalidacao.
- O Passo F **esta concluido para o escopo do agente**, com essas duas
  verificacoes explicitamente pendentes do dono.

## Resultados do checkpoint anterior (historico)

- **Passo A:** correção de segurança concluída no commit local autorizado
  `bf409c5`. Não foi enviado ao remoto.
- **Passo B:** seed idempotente criou oito tutores, 48 cães e seis
  prestadores de demonstração. O treino consultou 50 linhas no PostgreSQL
  (48 seedadas e duas preexistentes), fonte `banco real`, K=7 e Silhouette
  0,552. A distribuição por cluster está em
  [`dados-demonstracao-ml.md`](./dados-demonstracao-ml.md). Os registros
  seedados são sintéticos, não usuários reais. O notebook não foi
  reexecutado; seus outputs anteriores estão desatualizados.
- **Passo C:** cinco testes do serviço ML passaram: autenticação ausente,
  modelo ausente, resposta com modelo de teste, pet não pertencente ao tutor
  e outros casos de rota. Pytest reportou três avisos de depreciação em
  Starlette/FastAPI.
- **Passo D:** integração local Nest → FastAPI → PostgreSQL respondeu com
  recomendações para o pet ativo da conta demo. O serviço Nest validou o pet
  e a tela recebeu passeadores ordenados. A mesma rota respondeu `200` no
  Swagger UI com o login demo.
- **Passo E:** fluxo manual executado em `http://127.0.0.1:5173/`, autenticado
  como `demo01@demo.zelopets.local`: Home → Mobilidade → recomendações →
  agendamento de 45 minutos (estimativa R$ 35) → Agenda → Home com o próximo
  cuidado atualizado.
- **Passo F — build/testes:** `pnpm build`, `pnpm lint`, 13 testes unitários,
  um teste e2e, build/type-check do frontend e cinco testes pytest passaram.
  O teste e2e não acessou o banco Neon.
- **Responsividade:** em 360, 390, 768 e 1200 px não houve rolagem horizontal.
  A tela de Mobilidade tem um `<h1>` e um `<main>`; controles de formulário
  rotulados, botões nomeados e áreas de botão com pelo menos 44 px foram
  verificados. A navegação por Tab percorreu voltar, cartões, data, duração e
  envio.

## Pendências originais anteriores à revalidação

Registro historico da situacao antes da revalidacao descrita acima. As
pendencias abaixo foram parcialmente resolvidas; o estado atual e o restante
do Passo F estao resumidos no topo deste documento.

- Axe não foi executado. A ferramenta de browser disponível não oferece o
  auditor Axe e não há pacote Axe instalado localmente; as verificações
  estruturais acima não substituem esse relatório.
- Lighthouse Snapshot não foi executado na Home logada nem em Mobilidade.
  Portanto não há notas Lighthouse para reportar. A URL local e o estado
  autenticado usados no fluxo manual não são medições Lighthouse.
- O teste manual do endpoint foi feito pela interface, não pela UI Swagger.
- As células do notebook não foram reexecutadas; consulte a observação no
  relatório da seed.
- Pytest passou com três avisos de depreciação de dependências, sem falhas.

## Efeito no banco compartilhado

O fluxo manual criou um passeio de demonstração para
`demo01@demo.zelopets.local`, em 25/10/2026 às 10:30, com status pendente.
Ele foi mantido no Neon para confirmar o próximo cuidado e a Agenda. Nenhum
reset do banco foi executado.

## Plano de commits pendentes

1. `feat(ml): seed de dados de demonstração com perfis realistas e retreino`
   — seed, treino/notebook e documentação B.
2. `feat(ml): pet_id, ids de prestadores e token interno no /recommend`
   — proteção e testes do serviço ML, documentação C.
3. `feat(api): endpoint de recomendações consumindo o ml-service`
   — endpoint Nest, configuração e documentação D.
4. `feat(front): Mobilidade com vitrine de recomendados e agendamento de passeio`
   — Home, tela, API frontend, estilos e documentação E.
5. `chore: validação do bloco 2 (acessibilidade, testes e docs)`
   — README e relatório de validação F.

Nenhum commit B–F ou push foi realizado. O `.vscode/settings.json` permanece
fora do escopo.

Onde estamos: Bloco 2 · Passo F de 6 concluido para o escopo do agente;
Lighthouse Snapshot e confirmacao final por teclado ficam com o dono.

## Correções aplicadas após o Passo F

- O `PATCH` genérico de passeio, hospedagem e assinatura não aceita mais
  `status`; mudanças de estado passam por operações de domínio, como
  cancelamento, para impedir que o cliente falsifique o estado.
- O CORS da API é limitado por `CORS_ORIGINS`, com origens locais como padrão
  de desenvolvimento. Em publicação, configure explicitamente as origens
  permitidas.
