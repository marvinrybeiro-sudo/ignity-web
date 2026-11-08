# Changelog

Todas as mudanças relevantes deste pacote ficam registradas aqui.

## [2.0.0-alpha.0] - não publicado

### Adicionado

- Pacote `ignity` com a fonte única em `content/`, copiada sem alteração do kit v1 (`framework-agentico-web/`).
- Build determinístico de `dist/{skill}.zip` (`npm run build`).
- Fixture `test/fixtures/v1-manifest.json` com caminho e SHA-256 dos 29 arquivos que o `instalar.py` v1 instala no modo `both`.
- CLI com `init`, `update`, `doctor`, `status` e `uninstall`, manifesto, backups e migração v1. Usa apenas módulos nativos do Node, sem dependências de runtime.
- Suíte de testes `node:test` para conteúdo, distribuição e cenários do instalador.
- Licença MIT.

### Alterado

- Adapters e `web-orchestrator` procuram o guia em `.ignity/framework/FRAMEWORK.md`, com alternativas para instalações v1 e leitura direta do pacote.

- Story 1.3: Custom Fonts mantido; Google Fonts aceita via self-hosted com licença web, sem CDN por padrão; skill elementor versionada no próprio CHANGELOG.

### Wizard de inicialização (Story 1.4)

- BRIEF mínimo com quatro perguntas ou flags, saneamento das URLs e rascunho por padrão. BRIEF existente preservado; adapters sugerem próximo passo do STATE.

### Aprendizado por projeto (Story 1.15)

- Template IGNITY-FEEDBACK.md e atualização pelo orquestrador em checkpoints e encerramento, com problemas observados e ideias de melhoria anonimizados, sem envio automático.
