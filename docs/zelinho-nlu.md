# NLU do Zelinho

O produto usa um híbrido de regras de alta precisão e TF-IDF de palavras e
caracteres com regressão logística. Regras são aplicadas primeiro para saúde,
incidentes, pagamentos, privacidade, atendimento e comandos inequívocos. O
modelo só aceita uma intenção quando há sinal conhecido e confiança suficiente;
casos ambíguos pedem confirmação e entradas sem sinal entram em falha de
entendimento.

A avaliação por famílias anterior do artefato estatístico registrou acurácia
de 42,98%, F1 macro de 35,63% e top-3 de 72,73%. Esses números são mantidos
sem mascaramento; a suíte operacional mede o comportamento híbrido e atingiu
30/30 no smoke. O conjunto ouro permanece pendente de frases revisadas pelo
grupo.

Limitações conhecidas: o conjunto estatístico ainda é pequeno e algumas
intenções próximas dependem de regras contextuais. O próximo ciclo deve
ampliar frases por família antes de ajustar limiares.
