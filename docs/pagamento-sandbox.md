# Preparação para pagamento sandbox

O pagamento real ainda não está habilitado. A preparação seguirá um fluxo
simulado, sem credenciais, cartão real ou transação financeira:

1. criar uma intenção de pagamento vinculada ao tutor e ao serviço;
2. iniciar em `PENDENTE`;
3. simular transições para `APROVADO`, `RECUSADO` ou `CANCELADO`;
4. liberar a confirmação do agendamento somente quando aprovado;
5. registrar a referência da simulação para auditoria.

A implementação deve ficar isolada do provedor externo. O frontend não deve
receber segredos, e o backend deve validar ownership, valor calculado no
servidor e transições permitidas. ZeloCoins poderá ser integrado como forma de
desconto sem alterar o saldo antes da confirmação.
