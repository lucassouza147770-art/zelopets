# Home do tutor

## Componentes

- `CabecalhoZelo`: marca, `ChipZeloCoins` no cabeçalho e botão de perfil.
- `SaudacaoComPet`: saudação com o nome retornado pela API, título da Home e
  seletor do cão ativo.
- `CartaoProximoCuidado`: cartão acessível para o próximo evento, com estado
  carregando, conteúdo, vazio ou erro.
- `ListaDeServicos`: três linhas de mesmo peso para Mobilidade, Hotel ZeloPets
  e Nutrição.
- `AtalhoZelinho`: acesso compacto ao atendimento do Zelinho.
- `BarraDeNavegacao`: quatro destinos com ícone e rótulo; Início indica a
  página atual.

## Dados e estados

O perfil e o saldo vêm de `GET /tutores/me`. Os cães vêm de `GET /pets`; a
seleção é guardada em `localStorage` sob `zelopets:petAtivoId` e, se não
existir ou não corresponder a um cão retornado, o primeiro cão é selecionado.
O próximo cuidado vem de `GET /agenda/proximo`. Cada chamada tem estado de
carregamento e mensagem de erro no bloco correspondente. Um `401` sinaliza à
aplicação que a sessão expirou. Valores de saldo não são simulados no front.

Sem cães cadastrados, a saudação convida a cadastrar o primeiro. Sem cuidado
futuro, o cartão informa que não há cuidado agendado e sugere um passeio.
Fotos só são exibidas quando a API retorna uma foto do cão; sem foto, o avatar
usa a inicial do nome.

## Layout e acessibilidade

A Home usa uma coluna com largura máxima de 480 px, alvos de toque de pelo
menos 44 px nos controles interativos, foco visível e barra inferior fixa que
respeita `safe-area-inset-bottom`. Os ícones são do `lucide-react`; o avatar do
Zelinho é uma inicial caramelo provisória. O movimento é reduzido conforme a
preferência do sistema.

Onde estamos: Fase 2 — Home final · Passo 3 de 5 concluído (commit pendente de autorização).
