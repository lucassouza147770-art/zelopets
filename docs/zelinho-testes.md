# Testes do Zelinho

## Resultado atual

- Demonstração obrigatória: **10/10**.
- Smoke adversarial: **30/30**.
- Testes Python do chatbot: **37 passados**.
- Build Nest: passou.
- Build frontend: passou.

## Casos críticos cobertos

Saudações, abreviações, typos, catálogo, assinatura, agenda, saldo,
mensagens aleatórias, repetição, pedido de atendente, incidente de serviço e
emergência de saúde. “Machucou no hotel” gera incidente com prioridade alta;
“passando mal” orienta veterinário e não abre chamado automaticamente.

Para repetir:

```powershell
$env:API_URL='http://127.0.0.1:3001'
pnpm demo:zelinho
pnpm zelinho:smoke
```
