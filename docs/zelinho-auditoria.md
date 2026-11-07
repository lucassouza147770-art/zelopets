# Auditoria do Zelinho

| Requisito | Situação | Arquivo |
|---|---|---|
| Token interno comparado com `compare_digest` | atende | `ml-service/app/chatbot/router.py` |
| Mensagem de 1 a 500 caracteres e tutor injetado pelo Nest | atende | `src/zelinho/dto/mensagem-zelinho.dto.ts` |
| 20 mensagens/minuto e 200/dia | parcial: limites em memória no Nest | `src/zelinho/zelinho.service.ts` |
| Contrato com confirmação, sugestões, estado e handoff | atende no Python | `ml-service/app/chatbot/router.py`, `dialogue.py` |
| Duas falhas consecutivas levam a atendente | atende no diálogo; chamado persistido ainda falta | `ml-service/app/chatbot/dialogue.py` |
| Histórico persistente e chamado com protocolo | falta | — |
| Estado com TTL de 30 minutos | atende em memória; não escala entre processos | `ml-service/app/chatbot/dialogue.py` |
| NLU híbrido palavra/caractere | atende parcialmente; sem artefato calibrado versionado | `ml-service/app/chatbot/nlu.py` |
| Dataset mínimo de 40 frases por intenção | falta | `ml-service/app/chatbot/nlu.py` |
| Conjunto de ouro e métricas | pendente | `ml-service/data/zelinho_teste_ouro.csv` |

O protótipo anterior tinha 16 intenções e 4 frases por intenção. Após a
correção, há 24 intenções e 4 a 6 frases por intenção. Acurácia, F1 macro,
pior classe, top-3 e limiares calibrados não foram reportados porque ainda não
existe divisão família/validação/teste nem conjunto de teste executável.
`T_ALTA=0,70`, `T_BAIXA=0,40` e `MARGEM=0,15` permanecem como valores iniciais.
