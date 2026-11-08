---
name: web-assets
description: Inventariar, otimizar e associar logos, imagens, SVGs, favicon e fontes locais à biblioteca WordPress e às seções do Elementor. Use na preparação ou substituição de assets de uma página.
---

# Assets e fontes

Inspecionar os arquivos e a biblioteca existente antes de importar. Usar `project/ASSETS.csv` para relacionar arquivo, uso, breakpoint, peso, dimensões, attachment ID e URL.

## Procedimento

1. Listar os arquivos pertinentes e abrir os que exigem inspeção visual. Confirmar variantes claro/escuro e desktop/mobile; nomes ajudam, mas não comprovam o destino.
2. Manter originais intactos e gerar cópias otimizadas. Preferir SVG confiável para logos/ícones; usar WebP para fotos e fundos, com meta de 100 KB por imagem, sem sacrificar legibilidade. Registrar exceções justificadas; não ampliar uma imagem pequena.
3. Confirmar fontes locais cadastradas em Custom Fonts, pesos e estilos usados. Não trocar por Google Fonts ou fonte semelhante silenciosamente.
4. Consultar biblioteca para evitar duplicatas. Upload pelo MCP apenas quando suportado; usar o editor autenticado para a operação ausente. Em SVG, verificar integridade e remover scripts/conteúdo ativo se presentes; não afrouxar a segurança global do WordPress para aceitar um arquivo.
5. Aplicar as referências no widget nativo, nas propriedades das instâncias ou no fundo responsivo conforme o schema. Ícone de card deve continuar editável quando isso foi pedido.
6. Reabrir a página e conferir resolução, transparência, proporção, contraste e versão por breakpoint. Usar alt descritivo para conteúdo e alt vazio para decoração.

## Favicon e imagem de destaque

Preparar ícone quadrado em tamanho adequado à interface WordPress, preservando a marca. Para destaque solicitado como print da hero, capturar a hero real, sem interface administrativa quando possível, converter para WebP e validar o arquivo. Registrar o recorte e as dimensões; não apresentar um mockup como screenshot real.

## Conclusão

Os assets carregam por URLs válidas do site e o inventário diferencia preparado, enviado, aplicado e verificado. Não declarar importação concluída quando só existe um arquivo local.
