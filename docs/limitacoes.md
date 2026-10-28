# Limitações conhecidas e escopo

Os itens abaixo não fazem parte da entrega atual e não possuem botões falsos
na interface:

- login com Google;
- recuperação de senha por e-mail;
- upload e persistência de foto do cão.

Esses fluxos exigem integrações e tratamento de dados adicionais. O login
atual usa e-mail e senha com JWT. O atendimento do Zelinho usa um classificador
local determinístico no frontend; integração com um LLM permanece aguardando
chave e nenhuma credencial deve ser enviada ao frontend ou commitada.
