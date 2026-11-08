# Framework Agêntico Web

Versão 1.0 · 8 de novembro de 2026

Kit portátil para transformar briefing, Figma e assets em páginas WordPress/Elementor editáveis, revisar o resultado e continuar o projeto no Codex ou no Claude. Nasceu do projeto Prática Comportamental, mas não carrega seus acessos, IDs ou URLs como configuração de novos sites.

## Comece aqui

1. Copie este kit para a pasta do novo projeto.
2. Instale as skills com o instalador abaixo, escolhendo o cliente.
3. Preencha `project/BRIEF.md`, sobretudo destino, referência, assets e escopo.
4. Conecte o MCP do WordPress correto no cliente escolhido. As skills não criam conexão nem transferem autenticação entre aplicativos.
5. Use o [prompt de início](templates/INICIAR.md). Para continuar um projeto, use [RETOMAR.md](templates/RETOMAR.md).

O fluxo completo está em [FRAMEWORK.md](FRAMEWORK.md). A execução começa pela skill `web-orchestrator`, que carrega apenas os módulos relevantes ao pedido.

## Instalação em um projeto

Requer Python 3, sem pacotes adicionais. Dentro desta pasta:

```bash
python3 scripts/instalar.py --dest "/caminho/do/novo-projeto" --client both --dry-run
python3 scripts/instalar.py --dest "/caminho/do/novo-projeto" --client both
```

Use `codex`, `claude` ou `both`. O instalador copia as skills para `.agents/skills/` no Codex e `.claude/skills/` no Claude Code. Também prepara documentos do projeto e arquivos `AGENTS.md` e/ou `CLAUDE.md`. Não sobrescreve arquivos diferentes: em caso de conflito, interrompe antes da cópia e pede mesclagem manual.

Para instalação manual, copie cada pasta de `skills/` para o diretório correspondente e use os arquivos de `adapters/` como orientação inicial. Preserve instruções já existentes no projeto. Reinicie a sessão ou reabra o projeto se as skills não aparecerem; confirme a descoberta pedindo ao assistente para localizar `web-orchestrator`.

No Codex, você pode chamar `$web-orchestrator`. No Claude Code, `/web-orchestrator`. O pedido por linguagem natural também pode ativar a skill quando ela estiver disponível. Os diretórios e formas de uso foram conferidos nas [documentações oficiais](references/PORTABILIDADE.md).

## Claude no navegador ou Desktop

O ZIP geral é um kit de projeto, não uma única skill para importar. A pasta `dist/` contém um ZIP por skill para upload individual em Customize > Skills, quando esse recurso estiver disponível. Ative os módulos necessários, inclusive `web-orchestrator` e `elementor`. Envie também o briefing e os arquivos de estado do projeto. Outra opção é anexar o guia e as skills relevantes como documentos e pedir sua leitura explicitamente; anexar um arquivo não significa instalar uma skill.

A execução no WordPress depende das ferramentas e do MCP disponíveis naquela sessão. Levar as instruções para Claude não leva a sessão autenticada do Codex. Sem ferramenta de escrita, o assistente deve produzir especificações e arquivos locais e declarar o que falta aplicar.

## Conteúdo do kit

| Módulo | Responsabilidade |
|---|---|
| `web-orchestrator` | Escopo, etapas, estado e retomada |
| `web-figma-spec` | Inspeção do Figma, medidas e mapa de seções |
| `web-assets` | Logos, fundos, ícones, fontes e biblioteca |
| `elementor` | Sua skill original de construção nativa, preservada |
| `web-motion` | Scroll, sticky, carrosséis, blur e divisores |
| `web-seo` | Metadados, favicon e compartilhamento |
| `web-qa` | Revisão visual, funcional e de editabilidade |
| `web-release` | Salvamento, publicação autorizada e entrega |

`templates/` guarda briefing, mapa de assets e seções, estado, decisões e relatório de QA. `skills/elementor/references/operacao.md` acrescenta as lições deste projeto sem reescrever sua skill original. Não há criação automática de agentes, publicação, instalação de plugins ou mudanças no site ao instalar o kit.

## Manutenção

Registre uma falha demonstrada em `project/DECISIONS.md`. Transforme-a em regra apenas quando for reutilizável e com escopo claro. Atualize a skill de origem e distribua novamente as cópias dos dois clientes. Revise os arquivos antes de compartilhá-los: os registros de um projeto real podem conter informações privadas, mesmo sem senhas.
