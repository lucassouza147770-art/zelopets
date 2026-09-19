# Cores

## Paleta

### Verde ZeloPets

- `--cor-dominante: #2F7A5C`
- `--cor-dominante-escura: #27644B`

É a cor dominante e estrutural da interface. Deve aparecer em superfícies que
organizam a experiência, como a saudação, as portas de cuidado e a navegação.
A variação escura é reservada para estados `hover` e `pressed` dessas
superfícies.

### Âmbar Caramelo

- `--cor-acento: #E0A24B`
- `--cor-acento-escura: #D18924`

É o acento de prioridade. Deve ser usado em uma única ação principal por tela,
como criar o gêmeo digital, falar com o Zelinho ou destacar uma porta de
cuidado. A variação escura fica para `hover` e `pressed`. O uso isolado mantém
o significado de "isso aqui importa mais".

### Verde-menta

- `--cor-respiro: #A8E6C8`
- `--cor-respiro-escura: #70D6A5`

É a cor de respiro e status informativo. Deve ser aplicada em elementos
informativos e não clicáveis, como a faixa do próximo agendamento. Não deve
funcionar como convite para uma ação.

## Base e contraste

- `--cor-fundo: #FFFBF5` é o canvas claro e acolhedor.
- `--cor-texto: #1F2A24` é o texto principal.
- `--cor-texto-sobre-dominante: #FFFBF5` é usado sobre o Verde ZeloPets.

As variáveis vivem em `frontend/src/styles/cores.css` e são carregadas pelo
entrypoint em `frontend/src/main.tsx`. A aplicação das cores está agrupada por
função: dominante para estrutura, acento para a única ação prioritária e
respiro para informação.