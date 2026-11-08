---
name: web-seo
description: Configurar identidade e SEO de uma página WordPress, incluindo título, descrição, idioma, favicon, imagem de destaque e compartilhamento, verificando o cabeçalho renderizado e evitando tags duplicadas.
---

# Identidade e SEO

Não prometer ranking ou indexação. Usar conteúdo real e intenção da página. Pesquisar documentação primária atual quando houver dúvida sobre implementação, requisitos ou comportamento de buscadores.

## Diagnóstico

Ler URL publicada/canônica, título atual, resumo, template, idioma, favicon e mecanismo de SEO existente. Inspecionar o HTML inicial do cabeçalho, além do DOM quando disponível. Identificar quem emite cada tag: tema, plugin SEO, WordPress ou Custom Code. Não instalar um plugin só para duplicar capacidades já presentes.

## Configuração

1. Escrever título específico com serviço/tema e marca, sem repetição artificial de palavras. Não trocar uma headline comercial medida do Figma apenas para encaixar keywords; título SEO e H1 têm funções relacionadas, mas não precisam ser idênticos.
2. Escrever descrição única e fiel. Salvar no mecanismo existente; se o tema usa resumo como descrição, conferir esse resultado antes de adicionar uma nova meta tag. Tamanho recomendado é referência de redação, não garantia de exibição.
3. Preservar slug de página publicada salvo pedido de alteração com tratamento de redirecionamentos. Manter canonical coerente; evitar uma segunda tag manual sobre a já emitida.
4. Configurar favicon e imagem de destaque quando pedidos. Usar a hero real se o usuário pediu print e otimizar o arquivo; verificar proporção e recorte na apresentação social.
5. Adicionar Open Graph e cartão social apenas nos campos ausentes, com imagem pública, título, descrição, URL e locale corretos. Restringir código específico à página correta, sem propagar para todo o site.
6. Conferir idioma real da página. Se houver mudança de idioma global do WordPress, considerar seu alcance no painel e nas outras páginas; alterar somente quando a intenção do projeto justificar esse alcance.
7. Verificar um H1 principal coerente, hierarquia de títulos, links descritivos e alt pertinente. Não inventar FAQ, avaliações, organizações, cursos ou schema com dados ausentes. Dados estruturados só se refletirem conteúdo real e requisitos aplicáveis.

## Verificação

Reabrir depois de salvar. Conferir título, description, canonical, robots, favicon, OG e cartão social. Contar tags equivalentes e corrigir duplicações. Verificar que metadados estão no cabeçalho entregue pelo servidor; não considerar concluído com uma inserção feita apenas por JavaScript depois do carregamento.

Não remover noindex de staging nem alterar indexação global sem intenção de publicação e autorização compatíveis. Relatar separadamente “configurado”, “publicado” e “indexado”: só o último exige evidência do buscador. Registrar limitações de acesso, ausência de teste social ou de Search Console quando relevantes.
