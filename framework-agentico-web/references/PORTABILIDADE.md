# Portabilidade e fontes

Consulta em 8 de novembro de 2026. Os caminhos de instalação podem evoluir; em caso de divergência, conferir a documentação oficial do cliente. O conteúdo do método é próprio e deriva das decisões do projeto; as fontes abaixo sustentam o formato e a instalação das skills.

- [OpenAI — Build skills](https://learn.chatgpt.com/docs/build-skills): estrutura `SKILL.md`, descoberta e arquivos de suporte.
- [OpenAI — Customization](https://learn.chatgpt.com/docs/customization/overview): skills por projeto em `.agents/skills`.
- [Anthropic — Extend Claude with skills](https://code.claude.com/docs/en/skills): `.claude/skills`, comandos por nome e recursos de suporte.
- [Anthropic — Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude): upload e ativação em Customize > Skills, sujeitos às capacidades da conta.

## Contrato portátil usado neste kit

Cada skill tem pasta própria e frontmatter apenas com `name` e `description`. O corpo é Markdown com instruções independentes de APIs internas de um cliente. Não há hooks, `allowed-tools`, execução automática ou configurações específicas de agentes. Os conectores são descobertos na sessão real.

AGENTS.md e CLAUDE.md são adaptadores de entrada, não cópias de todas as skills. O instalador mantém os documentos de projeto em um local comum. No modo both, existem cópias das skills para descoberta pelos dois clientes; alterações futuras precisam ser sincronizadas a partir da origem.

Os ZIPs individuais incluem toda a pasta da skill, com referências internas. Recursos que estão em outra skill devem ser instalados/ativados separadamente. O guia completo e os registros do projeto são material de projeto; no Claude sem acesso à pasta local, devem ser enviados junto com o contexto necessário.
