---
name: web-qa
description: Revisar páginas Elementor contra referência e pedido, verificando desktop/mobile, assets, componentes editáveis, navegação, efeitos e metadados, com evidências de resultado.
---

# Revisão da página

Ler escopo e referência antes de testar. Usar a prévia correspondente à revisão alterada. Quando a página estiver publicada, distinguir a revisão pública da aberta no editor. Preencher `project/QA.md` com passou, falhou, não testado ou não se aplica.

## Inspeção visual

- Desktop e mobile: hierarquia, proporção, quebras, gaps, alinhamento, logos, fundos e ícones certos; tablet se o layout mudar nesse intervalo.
- Conferir largura efetiva do viewport e ausência de overflow lateral. Medir cards renderizados, não overlays do editor. Não confundir o track horizontal intencional com overflow do documento.
- Comparar primeiro as maiores diferenças com Figma e pedido; corrigir antes de detalhes cosméticos. Screenshots com animação no meio podem parecer desfocadas: observar o estado final.

## Interações

- Menu, toggle móvel, teclado, foco visível, destinos de CTA e âncoras que não ficam ocultas pelo header.
- Accordion/FAQ abre e fecha; sticky prende e libera; carrossel avança conforme o comportamento pedido e não bloqueia a navegação.
- Campos têm rótulo e estados necessários. Não enviar formulário real, disparar automação ou fazer contato externo para testar sem autorização específica. Usar ambiente de teste quando disponível.

## Editabilidade e persistência

- Título, descrição, imagem/ícone e link aparecem nos campos pertinentes; duas instâncias podem ter conteúdo distinto.
- Reabrir depois de salvar e conferir que a alteração persistiu. Confirmar a variante mobile e a revisão certa.
- Auditar apenas o CSS/JS afetado: escopo, duplicações, sintaxe e interferência em sticky/foco. Não ampliar a revisão para refazer o site inteiro.

## SEO e evidência

Conferir as tags alteradas no cabeçalho e a acessibilidade da mídia pública. Registrar caminho de screenshots, largura testada, estado/revisão e limitações. Para animações, registrar observação em múltiplas posições; não chamar uma captura isolada de teste funcional.

## Critério de entrega

Corrigir defeitos relevantes ao pedido e repetir os testes afetados. Não inventar pontuação de Lighthouse, Core Web Vitals ou acessibilidade sem executar a medição apropriada. Se o navegador estiver indisponível, entregar o que foi verificado por estrutura e marcar a revisão visual como pendente.
