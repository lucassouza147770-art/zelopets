# Caminho de pagamento sandbox

O pagamento real ainda não está habilitado. A preparação seguirá um fluxo
simulado, sem credenciais, cartão real ou transação financeira:

1. criar uma intenção de pagamento vinculada ao tutor e ao serviço;
2. iniciar em `PENDENTE`;
3. simular transições para `APROVADO`, `RECUSADO` ou `CANCELADO`;
4. liberar a confirmação do agendamento somente quando aprovado;
5. registrar a referência da simulação para auditoria.

A implementação atual está isolada de qualquer provedor externo. O endpoint
`POST /pagamentos/simular` recebe `{ tipo, id, metodo, resultado }`, exige o
JWT do tutor e só altera um registro PENDENTE pertencente a esse tutor.
`metodo` aceita `PIX` ou `CARTAO`; `resultado` aceita `APROVADO` ou `RECUSADO`.
Assim, uma futura API gratuita de desenvolvimento pode substituir apenas o
adaptador do backend, sem expor chaves ao frontend e sem criar um modelo novo.
ZeloCoins não é alterado durante a simulação.
