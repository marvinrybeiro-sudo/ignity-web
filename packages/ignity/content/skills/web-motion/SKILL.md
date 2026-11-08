---
name: web-motion
description: Implementar e revisar animações de entrada, header fixo com blur, seções sticky, carrosséis e divisores no Elementor, preservando conteúdo nativo e responsividade.
---

# Movimento e acabamento

Começar pelo comportamento pretendido, e não copiar um snippet integralmente. Inspecionar a estrutura, os efeitos existentes e os breakpoints antes de escrever CSS/JS. Preferir controles nativos quando suficientes e documentados; código adicional deve ser pequeno, isolado e reversível.

## Header fixo e blur

Usar o widget de menu compatível solicitado; não simular navegação com botões soltos. Definir posição, largura, z-index e compensação de altura para âncoras. Transparência deve manter contraste, e o blur deve ter fundo de fallback. Testar menu móvel aberto, foco, fechamento e sobreposição.

## Entrada no scroll

Preservar os nomes de classes quando fornecidos pelo usuário, mas corrigir conflitos e sintaxe. Preferir `IntersectionObserver` ou recurso nativo compatível. Definir se a entrada acontece uma vez ou se reverte ao sair. Evitar `transition: all` e delays anulados por `!important`; animar propriedades necessárias. Conteúdo deve permanecer acessível se o script falhar, no editor e com movimento reduzido. Não deixar seções permanentemente com opacity zero antes de inicialização bem-sucedida.

## Sticky e carrossel

1. Distinguir loop automático, rolagem horizontal manual e avanço horizontal vinculado ao scroll vertical. Implementar o comportamento autorizado, sem tratá-los como equivalentes.
2. Inspecionar altura da seção, área sticky, top do header, overflow e transform/filter nos ancestrais. Não aplicar animação de transform ao ancestral que precisa ancorar a seção.
3. Em scroll vertical vinculado, calcular curso a partir da largura real do track e da janela; recalcular em resize, carregamento de fontes/imagens e mudança de breakpoint. Limitar o progresso e liberar a seção no final.
4. Em loop automático, impedir saltos perceptíveis, oferecer pausa quando apropriado e evitar IDs duplicados e links duplicados alcançáveis por teclado nas cópias decorativas.
5. Com `prefers-reduced-motion`, manter conteúdo acessível com alternativa estática ou manual. Evitar hijacking de rolagem; permitir saída natural da seção.

## Divisores

Usar asset local da biblioteca, shape nativo ou CSS conforme a referência. Manter cores do projeto e impedir que o recorte esconda conteúdo/interativos. Corrigir valores inválidos como `display: visible`, `display: hidden` e `height: fit-contenat`; escolher a intenção correta entre `display`, `visibility` e altura válida. Não aplicar fundo roxo de um exemplo em uma marca azul por acidente.

## Conclusão

Verificar desktop/mobile no começo, durante e após a seção; testar resize e preferência por movimento reduzido quando houver ferramenta para isso. Registrar o que foi testado. Uma screenshot não comprova o loop, o sticky ou a saída da seção; observar o comportamento em mais de uma posição de scroll.
