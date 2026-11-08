---
name: web-figma-spec
description: Inspecionar frames desktop e mobile do Figma e converter a referência em especificação de seções, componentes e assets para Elementor. Use antes de implementar ou comparar uma página com o design.
---

# Especificação do Figma para Elementor

## Entradas

Link e nó do Figma, frames pretendidos e escopo. Caso o cliente tenha skill obrigatória do conector Figma, carregá-la antes das chamadas correspondentes. Descobrir a ferramenta real e usar as fontes acessíveis nessa sessão.

## Procedimento

1. Inspecionar os frames e confirmar quais representam desktop e mobile. Não tratar versões antigas ou componentes isolados como a página final.
2. Ler conteúdo, hierarquia, Auto Layout, constraints, medidas e estilos; obter capturas da referência. Quando não houver acesso, usar os materiais fornecidos e explicitar os limites.
3. Mapear cada seção em `project/SECTIONS.md`: nome, frame/nó, conteúdo, largura útil, padding/gap, tipografia, fundo, CTA, componente e comportamento móvel.
4. Identificar padrões repetidos e propor componente nativo com propriedades que realmente variam. Separar ícone editável de decoração fixa.
5. Relacionar versões de assets à seção e ao breakpoint. Conferir visualmente fundos e logos com nomes ambíguos.
6. Definir o que é reprodução medida e o que é adaptação necessária por limitações do Elementor. Registrar diferenças materiais antes de consolidar a solução.

## Critérios de conclusão

Cada seção do escopo tem uma referência e uma implementação nativa prevista. Os estados mobile e desktop foram comparados. Conteúdo, ordem e destino dos CTAs estão claros. Não alterar copy ou inventar depoimentos, credenciais, certificações e resultados para preencher lacunas. Solicitar confirmação somente para informação que não possa ser inferida com segurança.

## Saídas

Mapa de seções, lista de componentes/propriedades, tokens pertinentes e lista de assets necessários. Registrar decisões do projeto sem transformar suas cores, fontes ou número de seções em regra universal.
