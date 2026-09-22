# Responsivo e movimento

## Breakpoints

### Base: até 599px

O celular usa uma coluna única para preservar a ordem de leitura: saudação,
agendamento, portas de cuidado e acesso ao Zelinho. A galeria de raças usa
três colunas compactas.

### Tablet: a partir de 600px

As portas de cuidado passam para duas colunas. A porta com a classe
`.porta-de-cuidado--destaque` ocupa as duas colunas com `grid-column: 1 / -1`.
Assim, mais espaço não transforma a ação prioritária em uma célula comum.
A galeria de raças passa para quatro colunas.

### Desktop: a partir de 960px

As portas passam para três colunas, mantendo a porta destacada na largura
completa da grade. A galeria de raças passa para seis colunas. Os containers
das telas permanecem limitados a `640px` para evitar linhas de texto longas.

## Os dois momentos de movimento

### 1. Porta de cuidado destacada

O `hover` eleva levemente e adiciona sombra; o `active` comprime o controle.
Esse é o único movimento de interação porque a porta destacada representa a
ação mais importante do painel. Animar todas as portas diluiria a hierarquia.

### 2. Faixa de agendamento

Quando deixa o estado de carregamento, a faixa aparece com uma entrada curta
de `320ms` usando `revelar-agendamento`. O movimento chama atenção para um
dado relevante sem transformar a atualização em uma animação de página inteira.

Todos os demais elementos permanecem estáticos nesta etapa. A regra
`prefers-reduced-motion: reduce` remove tanto a animação da faixa quanto a
transição da porta destacada para respeitar a preferência de acessibilidade.