# ignity

Framework agêntico para criar e manter sites WordPress + Elementor Pro com Claude Code e Codex.

> Versão `2.0.0-alpha.0`: em desenvolvimento e ainda não publicada.

## Pré-requisitos

- Node.js 22 ou superior
- Claude Code e/ou Codex
- WordPress com Elementor Pro Advanced ou superior: o plano Essential não inclui Custom Code, usado pelo Ignity Motion
- Licença MIT (veja `LICENSE`)

## Estrutura

- `content/`: fonte única das skills, templates, adapters e do `FRAMEWORK.md`
- `scripts/build-dist.js`: gera `dist/{skill}.zip`, um por skill, de forma determinística
- `scripts/snapshot-v1.js`: gera `test/fixtures/v1-manifest.json` a partir do kit v1
- `test/`: suíte `node:test`, sem dependências externas

## Comandos

Após disponibilizar o pacote, use `npx ignity-web` seguido de:

- `init`: instala o framework e cria os templates ausentes.
- `update`: atualiza o framework sem modificar `project/`.
- `doctor`: verifica a instalação e indica próximos passos.
- `status`: mostra a versão instalada e o estado do projeto.
- `uninstall`: remove os arquivos gerenciados, preservando alterações do usuário.

Use `--help` para consultar as opções do CLI.

Para desenvolvimento do pacote:

```bash
npm test          # roda a suíte
npm run build     # gera dist/
```

## Licença

MIT

A skill `elementor` é de autoria do usuário e versionada no próprio `content/skills/elementor/CHANGELOG.md`.
