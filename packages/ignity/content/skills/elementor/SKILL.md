---
name: elementor
description: Cria e edita páginas e partes de sites WordPress via Elementor MCP, a partir de Figma, HTML ou briefing. Use para layouts, componentes, header/footer, estilos globais e publicação no Elementor.
---

# Elementor via MCP

Construa conteúdo nativo e editável no Elementor, preservando o layout de referência e o escopo solicitado. Cada site tem seu próprio servidor MCP. Os nomes das ferramentas variam entre clientes; neste arquivo são citados pelos finais, como `elementor-build-composition`. Descubra os nomes e schemas reais antes de chamar ferramentas.

## 1. Contexto e conexão

- Aproveite o pedido, as referências e as autorizações já fornecidas. Pergunte apenas o que falta e muda materialmente o resultado; agrupe as dúvidas essenciais.
- Identifique o site pelas conexões disponíveis e pelo contexto. Se houver mais de um destino plausível, confirme o site antes de alterar qualquer conteúdo.
- Não solicite novamente um código de conexão quando o site correto já estiver conectado.
- Se não houver conexão, peça a configuração gerada pelo Elementor MCP e siga o procedimento do cliente atual. Comandos `claude mcp ...` são exclusivos do Claude Code; não os use no Codex. Não instale outro servidor ou plugin para substituir uma conexão funcional.
- Nunca repita senhas/tokens, nem os salve em arquivos do projeto ou resumos. Informe a necessidade de reconectar ou abrir nova sessão somente se o cliente realmente exigir.
- Para um site novo, identifique as páginas previstas, quais serão construídas agora e a referência visual. Para uma edição pontual, basta identificar a página e a alteração.
- Consulte páginas existentes quando o pedido exigir encontrá-las ou conferir a estrutura do site. Reutilize páginas e templates adequados; não crie duplicatas.

## 2. Capacidades e referência

- Use `elementor-list-resources` e `elementor-read-resource` para consultar a documentação do servidor quando necessário.
- Descubra os widgets com `elementor-list-widget-schemas` e leia o schema relevante com `elementor-get-widget-schema` antes de configurar um tipo ainda não inspecionado. Não invente propriedades.
- Diferencie elementos Atomic/V4 de widgets clássicos/V3. Não transfira parâmetros ou receitas de EMCP Tools para o MCP oficial sem confirmar o schema. Se um elemento não for suportado, explique a limitação e use uma alternativa compatível dentro do pedido.
- Leia o Figma, HTML ou briefing antes de construir. Para reproduzir uma página de referência, confira o conteúdo e os estilos disponíveis; use capturas para conferir o resultado visual. Não estime valores quando puder consultá-los diretamente.
- Se a referência não estiver acessível, avance apenas no trabalho independente dela e peça o material necessário.

## 3. Ordem de construção

Para um site novo completo:
1. Confira as páginas existentes e crie como rascunho apenas as páginas previstas no escopo autorizado (`elementor-create-page`).
2. Prepare a navegação após as páginas existirem. Verifique se há ferramenta para criar menus; se faltar, use o navegador quando disponível ou explique o passo manual necessário. Não declare o menu criado sem verificar.
3. Crie ou reutilize Header e Footer como partes separadas do site (`elementor-list-site-parts` / `elementor-manage-site-parts`), com atribuições adequadas. Não os coloque dentro do conteúdo da página.
4. Construa as páginas desta sessão por seções verificáveis (`elementor-build-composition`, `elementor-manage-elements`). Consulte se a operação acrescenta, substitui ou recria conteúdo antes de aplicá-la.
5. Confira o resultado e siga a regra de publicação abaixo.

Para uma seção, landing page sem navegação ou edição pontual, execute somente o necessário. Não crie outras páginas, menus, header/footer ou altere a página inicial sem que isso faça parte do pedido. Se o template da página ocultar header/footer, confira a configuração antes de recriá-los.

## 4. Organização, widgets e componentes

- Renomeie os containers de seção no Navigator com nomes curtos e claros: “Como funciona”, “Depoimentos”, “Contato”. Nomeie também containers internos importantes, como “Grade de serviços”.
- Use widgets nativos para títulos, textos, imagens, listas e botões. Botões devem usar o widget de Botão; nunca substitua uma seção inteira por HTML.
- HTML fica restrito a embeds ou recursos sem equivalente nativo, quando necessários ao pedido. Preserve a edição visual do restante.
- Menus devem usar o widget de navegação compatível disponível, ligado ao menu ou à fonte de itens exigida pelo schema. Não simule menus com botões ou links soltos.
- Cards de estrutura repetida devem usar componentes reutilizáveis quando suportados (`elementor-manage-component`). Confira antes `elementor-list-components`. Se não houver suporte, reutilize a estrutura nativa e informe a limitação.
- Ao alterar um componente, confira seus usos: a alteração pode atingir várias páginas. Não propague uma mudança global quando o pedido for local; crie uma variação quando necessário.

## 5. Estilos e fontes

- Comece lendo `elementor-get-default-styles` e os recursos de classes/variáveis disponíveis.
- Prefira classes e variáveis globais (`elementor-manage-classes`, `elementor-manage-global-variable`) a estilos repetidos. Reutilize os existentes quando adequados.
- Mudanças no kit, classes ou estilos globais podem afetar todo o site. Para uma alteração local, prefira uma classe específica ou configuração do elemento.
- Use fontes cadastradas em Custom Fonts do Elementor, com família, pesos e estilos registrados no BRIEF do projeto ou, se ausentes, na referência do Figma. Fontes de origem Google Fonts devem ser instaladas como Custom Font a partir de arquivos baixados (self-hosted), com licença que permita uso web; não carregar do CDN do Google por padrão.
- Confirme a disponibilidade por um recurso que liste fontes personalizadas ou pelo painel. Estilos globais, sozinhos, não comprovam esse cadastro.
- Se a fonte não estiver cadastrada, sem arquivo ou sem licença para uso web, pergunte qual fonte disponível usar ou solicite arquivo e licença apropriados. Não substitua silenciosamente.
- Confira tamanhos, espaçamentos e quebras em desktop e mobile. Não aplique parâmetros de responsividade sem consultar o schema correspondente.

## 6. Imagens e SVGs

- Consulte `elementor-list-assets` antes de subir arquivos duplicados.
- Para imagens raster novas, use WebP com meta de até 100 KB, mantendo a maior resolução útil ao layout. Não amplie imagens pequenas para aparentar maior resolução.
- Otimize localmente com `cwebp` ou Pillow: reduza primeiro a qualidade, depois as dimensões se necessário. Confira peso, dimensões e aparência final. Para imagens grandes em que 100 KB provoque perda visível, explique a exceção e escolha um equilíbrio adequado; respeite um limite rígido quando o usuário o exigir.
- Preserve transparência quando necessária. Logos e ícones vetoriais podem permanecer em SVG.
- Use upload pelo MCP apenas se houver ferramenta compatível. Para SVGs, prefira o upload pelo editor quando necessário e permitido pelo site.
- Se precisar acessar o WordPress no navegador, aproveite uma sessão autenticada. Quando houver login interativo, deixe o usuário fazê-lo, sem solicitar credenciais no chat.
- Se o upload estiver indisponível ou bloqueado, entregue os arquivos otimizados e informe o passo pendente. Não afirme que arquivos locais já estão na biblioteca.

## 7. Edição de páginas existentes

1. Localize a página pelo ID informado ou por `elementor-list-posts`, quando necessário.
2. Leia `elementor-get-page-structure` e as configurações pertinentes antes de alterar.
3. Use `elementor-manage-elements` para modificar somente os elementos necessários. Preserve conteúdo, links e estrutura fora do pedido; não reconstrua a página inteira para uma correção local.
4. Para configurações do documento, use `elementor-update-page-settings`. Confira o alcance antes de alterar templates ou atribuições.
5. Releia a estrutura alterada e confira o resultado renderizado. Se houver edição concorrente ou conflito, atualize a leitura antes de tentar novamente; não sobrescreva mudanças desconhecidas.

## 8. Revisão visual e funcional

Antes de concluir, gere uma prévia (`elementor-create-preview-link`) ou abra a página em ambiente acessível e confira:
- Desktop e celular: hierarquia, espaçamento, fontes, contraste, imagens, quebras e ausência de rolagem horizontal indevida.
- Correspondência dos textos e seções com a referência e o pedido.
- Destinos de botões e menus, links de contato e comportamento dos elementos interativos alterados.
- Header/footer e atribuições, quando fizerem parte do trabalho.

Corrija problemas relacionados ao trabalho antes da entrega. Não envie formulários reais ou acione integrações externas para testar sem autorização. Se não conseguir abrir a prévia, declare que a verificação visual ficou pendente; uma leitura da estrutura não substitui essa revisão.

## 9. Publicação e entrega

- Crie páginas novas em rascunho e revise antes de publicar.
- Publique com `elementor-publish-document` quando o usuário pedir publicação ou já tiver autorizado colocar o resultado no ar. A skill, por si só, não concede essa autorização. Não peça confirmação novamente quando ela já existir.
- Ao editar páginas já publicadas, confira como a ferramenta salva as alterações: elas podem aparecer imediatamente. Se o pedido exigir prévia antes de ir ao ar, use um fluxo de rascunho/revisão compatível antes de escrever; se ele não existir, esclareça essa limitação antes da alteração dependente.
- Publique apenas os documentos autorizados, incluindo partes do site e componentes pertinentes, conforme a necessidade real do servidor.
- Entregue o link da página ou da prévia e um resumo curto das alterações. Informe claramente o estado: rascunho, publicado ou pendente, e qualquer verificação que não pôde ser concluída.
