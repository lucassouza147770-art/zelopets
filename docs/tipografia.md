# Tipografia

## Fontes

### Fraunces

Fraunces é usada nos títulos e momentos de maior destaque. Suas curvas
expressivas trazem um tom editorial e acolhedor para a marca ZeloPets, sem
deixar a interface infantilizada.

Variável CSS: `--fonte-display`

Uso padrão: `h1`, `h2` e títulos de impacto.

### Figtree

Figtree é usada no corpo da interface. É uma sans humanista, legível em telas
pequenas e mais característica do que as pilhas genéricas de sistema, Inter ou
Arial.

Variável CSS: `--fonte-corpo`

Uso padrão: `body`, parágrafos, labels, inputs, botões e textos auxiliares.

## Escala

| Variável | Valor | Uso |
| --- | --- | --- |
| `--tamanho-corpo-sm` | `0.875rem` (14px) | Legendas e notas |
| `--tamanho-corpo` | `1rem` (16px) | Texto padrão |
| `--tamanho-corpo-lg` | `1.125rem` (18px) | Texto de destaque no corpo |
| `--tamanho-titulo-sm` | `1.5rem` (24px) | Títulos de seção compactos |
| `--tamanho-titulo` | `2rem` (32px) | Título principal da tela |
| `--tamanho-titulo-lg` | `2.75rem` (44px) | Saudação ou maior impacto visual |

As classes `.tipografia-legenda` e `.tipografia-destaque` são ganchos
semânticos para usos que não sejam headings. A aplicação das cores, ajustes
responsivos e estados visuais ficam para as próximas etapas.