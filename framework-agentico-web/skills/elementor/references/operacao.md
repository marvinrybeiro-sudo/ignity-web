# Complementos operacionais da skill Elementor

Ler este complemento ao operar revisão concorrente, componentes, Canvas ou um fallback de navegador. O `SKILL.md` desta pasta preserva a skill do usuário. Este documento explica situações aprendidas no projeto, sem fixar IDs, classes ou ferramentas de um site específico.

## Revisões e gravação

- Comparar documento publicado, autosave e prévia atual. Uma ferramenta MCP pode ler uma revisão diferente da aberta no editor; verificar isso, sem presumir que acontece em toda instalação.
- Se a árvore estiver antiga, não reconstruir ou substituir a página inteira. Usar uma operação atualizada e específica ou continuar pelo editor da revisão correta.
- Antes de salvar, verificar se o botão grava rascunho, autosave, metadados ou publicação. Esses estados podem ser independentes. Alterar título/resumo no WordPress pode ficar ao vivo mesmo com alterações visuais ainda em rascunho.
- Não restaurar uma revisão antiga apenas para eliminar o aviso de autosave. Avaliar o conteúdo primeiro.

## Elementor Canvas e partes do site

Canvas remove as partes do tema. Em uma LP com navegação própria e Canvas solicitado, manter a estrutura autossuficiente é apropriado. Para um site com header/footer compartilhados, usar Theme Builder quando aplicável. Não criar duas navegações nem trocar o template para contornar um problema local.

## Componentes utilizáveis

Expor as propriedades úteis dos filhos: título, descrição, imagem/ícone e link conforme o componente. Inspecionar o schema antes de escolher a propriedade. Não confundir uma imagem fixa dentro do componente com um campo personalizável por instância.

Verificar com duas instâncias distintas. Um card com ícone A deve continuar com A quando outro recebe B. Conferir também o default, os demais usos e o comportamento mobile. Usar uma variação local quando uma mudança no componente compartilhado extrapolaria o pedido.

## Editor e fallback

- Preferir ferramentas oficiais e schemas atuais. Um erro de plugin não autoriza alterar outros plugins permanentemente; testar desativação só com autorização específica e registrar restauração.
- Usar sessões autenticadas existentes. Seguir as ferramentas e instruções de navegador do cliente atual; não portar nomes de APIs de automação de um cliente para outro.
- Inspecionar o estado após abrir painel/modal ou selecionar elemento. Interfaces assíncronas podem manter controles antigos por um instante.
- Restringir seletores ao diálogo ativo em upload e seleção de mídia; controles ocultos duplicados podem acionar outro campo.
- Em editores de código ricos, conferir que substituir realmente substituiu. Se necessário, selecionar tudo, apagar e inserir pelo meio suportado. Reabrir e conferir início, fim e quantidade de blocos: inserir texto pode apenas prefixar ou anexar código antigo.
- Após mudar o viewport, confirmar `innerWidth` ou o tamanho renderizado no alvo correto. O resize de outra aba não comprova o teste mobile desta página.

## CSS e HTML localizados

Conteúdo, links e imagens permanecem nativos. CSS/JS deve cobrir apenas o comportamento ou detalhe sem equivalente suficiente. Preferir classes com nome estável e escopo de página/componente; IDs temporários só quando inevitável, documentados. Não adicionar regras globais para corrigir um card.

Para grid mobile, testar a estrutura renderizada dos componentes: wrappers podem usar `display: contents`. Medir os cards visíveis, não apenas os filhos imediatos da grade ou overlays do editor.
