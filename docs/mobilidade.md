# Mobilidade

Na Home autenticada, a linha Mobilidade abre a vitrine de passeadores e o
formulário para agendar um passeio para o cão ativo.

## Recomendações

O frontend consulta `GET /recomendacoes?petId=<id>` no NestJS. A tela escolhe
o pet salvo como ativo na Home (ou o primeiro pet disponível). O Nest valida
que o pet pertence ao tutor autenticado e busca recomendações no `ml-service`.
Somente prestadores do tipo `PASSEADOR` são mostrados na vitrine de
Mobilidade. Cada cartão exibe nome, avaliação, experiência e o motivo
compatível retornado pelo backend; tocar no cartão seleciona ou desmarca o
prestador opcional do agendamento.

Estados apresentados:

- carregamento: dois cartões-esqueleto;
- indisponibilidade: “Recomendações indisponíveis agora”;
- lista vazia: “Ainda não temos passeadores compatíveis com o {pet}”;
- sem cão cadastrado: convite para cadastrar um cão.

## Agendar passeio

O formulário exige data e hora futuras, duração de 30, 45 ou 60 minutos, e
envia o identificador do pet ativo. A seleção de passeador é opcional. Os
valores exibidos são estimativas de interface: 30 minutos = R$ 25, 45 minutos
= R$ 35 e 60 minutos = R$ 45. O NestJS recalcula o valor no servidor e não
aceita preço do cliente.

Erros do formulário são anunciados com `role="alert"`. Após o sucesso, a tela
mostra confirmação e oferece o atalho “Ver na agenda”. A tela usa rótulos
associados aos controles, controles de toque de pelo menos 44 px e foco
visível por teclado.

Onde estamos: Bloco 2 · Passo E de 6 concluído (commit pendente de autorização).
