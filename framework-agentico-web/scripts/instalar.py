#!/usr/bin/env python3
"""Copiar skills e modelos para um projeto, sem sobrescrever conteúdo diferente."""
import argparse
import shutil
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dest', required=True, type=Path)
    parser.add_argument('--client', choices=['codex', 'claude', 'both'], default='both')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    source = Path(__file__).resolve().parents[1]
    dest = args.dest.expanduser().resolve()
    pairs = []
    clients = ['codex', 'claude'] if args.client == 'both' else [args.client]
    for client in clients:
        folder = '.agents' if client == 'codex' else '.claude'
        for file in sorted((source / 'skills').rglob('*')):
            if file.is_file():
                pairs.append((file, dest / folder / 'skills' / file.relative_to(source / 'skills')))
        adapter = 'AGENTS.md' if client == 'codex' else 'CLAUDE.md'
        pairs.append((source / 'adapters' / adapter, dest / adapter))
    for file in sorted((source / 'templates').iterdir()):
        if file.is_file():
            pairs.append((file, dest / 'project' / file.name))
    pairs.append((source / 'FRAMEWORK.md', dest / 'project' / 'framework' / 'FRAMEWORK.md'))
    conflicts = []
    for original, target in pairs:
        if target.exists() and (not target.is_file() or original.read_bytes() != target.read_bytes()):
            conflicts.append(target)
    if conflicts:
        print('Nenhum arquivo foi copiado. Mescle manualmente os arquivos existentes:')
        for target in conflicts:
            print(target)
        return 2
    count = 0
    for original, target in pairs:
        if target.exists():
            continue
        print(('PREVER ' if args.dry_run else 'CRIAR ') + str(target))
        if not args.dry_run:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(original, target)
        count += 1
    print(f'{count} arquivos ' + ('previstos.' if args.dry_run else 'criados.'))
    print('A conexão MCP é configurada separadamente no cliente. Nenhuma ação foi feita no site.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
