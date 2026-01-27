

# Plano: Transições Instantâneas no Checkout

## Problema Identificado

A transição entre as etapas do checkout está lenta porque:

1. **AnimatePresence com `mode="wait"`**: Esta configuração faz com que a animação de saída termine ANTES da animação de entrada começar
2. **Duração de 250ms**: Cada transição leva ~500ms no total (250ms para sair + 250ms para entrar)
3. **Experiência esperada**: Quando você clica em um pedido, abre instantaneamente porque é uma navegação simples sem animação de espera

## Solução Proposta

Substituir a animação de slide por uma transição mais rápida e fluida que não bloqueia.

### Mudanças Técnicas

**Arquivo: `src/pages/CheckoutPage.tsx`**

1. Mudar `mode="wait"` para `mode="popLayout"` ou remover o mode completamente - isso permite que a animação de entrada comece imediatamente, sem esperar a saída
2. Reduzir a duração da animação de 250ms para 150ms 
3. Usar apenas fade (opacidade) em vez de slide horizontal - é mais rápido visualmente
4. Adicionar `layout` prop para transições mais suaves

```text
Antes (lento):
┌──────────┐     250ms      ┌──────────┐     250ms      ┌──────────┐
│  Tela A  │ ────────────▶ │  Vazio   │ ────────────▶ │  Tela B  │
└──────────┘    (saída)     └──────────┘   (entrada)    └──────────┘
                         Total: ~500ms

Depois (instantâneo):
┌──────────┐     150ms      ┌──────────┐
│  Tela A  │ ────────────▶ │  Tela B  │
└──────────┘  (simultâneo)  └──────────┘
                         Total: ~150ms
```

### Implementação

1. Remover `mode="wait"` do `AnimatePresence` para permitir transições simultâneas
2. Trocar animação de slide (`x: 100`) por fade simples (`opacity: 0 → 1`)
3. Reduzir duração para 150ms com easing mais agressivo (`easeOut`)
4. Usar `position: absolute` durante transição para evitar "salto" de layout

### Resultado Esperado

- Transição entre etapas será praticamente instantânea (~150ms)
- Sem "tempo morto" entre saída e entrada
- Experiência similar a clicar em um pedido que abre na hora

