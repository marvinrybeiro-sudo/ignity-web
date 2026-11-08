# Validação do pacote

Validado localmente em 8 de novembro de 2026.

- Oito skills com `name` e `description`, nomes válidos e corpo preenchido.
- Skill `elementor/SKILL.md` comparada byte a byte com `SKILLytb.md`, sem modificação.
- Links locais Markdown do pacote conferidos.
- Instalador executado em pasta temporária, para ambos os clientes.
- Dry-run confirmou o plano sem criar diretórios.
- Instalação repetida não duplicou nem alterou arquivos iguais.
- Conflito com um arquivo de estado modificado interrompeu toda a cópia e preservou o conteúdo existente.
- Pacotes ZIP individuais e geral conferidos quanto à integridade e à presença de `SKILL.md`.

O validador de skills do ambiente não pôde ser executado por ausência de PyYAML. Foram aplicadas verificações locais de estrutura, nomes, campos de frontmatter e conteúdo; isso não equivale a uma avaliação comportamental automática do assistente.

Não foi feita nova execução no WordPress, publicação, instalação global de skills ou teste dentro de uma sessão Claude. A compatibilidade estrutural foi preparada conforme a documentação oficial; disponibilidade de ferramentas, autenticação e execução dependem da sessão de destino. O próximo uso real deve registrar falhas observadas e ajustar as instruções com base em evidência.
