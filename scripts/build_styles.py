#!/usr/bin/env python3
"""Compile assets/styles.scss into assets/styles.css.

This project keeps SCSS as the editable source and writes a browser-ready CSS file.
The compiler below handles the subset of SCSS used in this codebase:
- variable declarations like $name: value;
- @import statements for local partials
- nested selectors using braces
- parent selector references with &
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
ENTRY = ASSETS / 'styles.scss'
OUTPUT = ASSETS / 'styles.css'

VARIABLE_RE = re.compile(r'^\s*\$(?P<name>[\w-]+):\s*(?P<value>.+);\s*$')
IMPORT_RE = re.compile(r"^\s*@import\s+'(?P<path>[^']+)'\s*;\s*$")


def load_scss(path: Path, visited: set[Path] | None = None) -> str:
    visited = visited or set()
    path = path.resolve()
    if path in visited:
        return ''
    visited.add(path)

    lines: list[str] = []
    for raw_line in path.read_text(encoding='utf-8').splitlines():
        match = IMPORT_RE.match(raw_line)
        if not match:
            lines.append(raw_line)
            continue

        import_target = match.group('path')
        target_path = (path.parent / f'{import_target}.scss').resolve()
        if not target_path.exists():
            parts = Path(import_target)
            target_path = (path.parent / parts.parent / f'_{parts.name}.scss').resolve()
        lines.append(load_scss(target_path, visited))

    return '\n'.join(lines)


def extract_variables(source: str) -> tuple[str, dict[str, str]]:
    variables: dict[str, str] = {}
    remaining: list[str] = []

    for line in source.splitlines():
        match = VARIABLE_RE.match(line)
        if match:
            variables[match.group('name')] = match.group('value').strip()
        else:
            remaining.append(line)

    return '\n'.join(remaining), variables


def replace_variables(source: str, variables: dict[str, str]) -> str:
    for name, value in sorted(variables.items(), key=lambda item: -len(item[0])):
        source = source.replace(f'#{{${name}}}', value)
        source = source.replace(f'${name}', value)
    return source


def normalize_selector(selector: str) -> str:
    return ' '.join(selector.strip().split())


def combine_selectors(parents: list[str], selector_text: str) -> list[str]:
    selectors = [normalize_selector(item) for item in selector_text.split(',') if item.strip()]
    if not parents:
        return selectors

    combined: list[str] = []
    for parent in parents:
        for selector in selectors:
            if '&' in selector:
                combined.append(normalize_selector(selector.replace('&', parent)))
            else:
                combined.append(normalize_selector(f'{parent} {selector}'))
    return combined


def render_rules(source: str) -> str:
    lines = [line.strip() for line in source.splitlines() if line.strip()]
    stack: list[dict[str, object]] = []
    rules: list[tuple[str, list[str]]] = []

    for line in lines:
        if line.endswith('{'):
            selector_text = line[:-1].strip()
            if selector_text.startswith('@media'):
                stack.append({'type': 'media', 'query': selector_text, 'children': []})
                continue

            parents: list[str] = []
            for entry in stack:
                if entry['type'] == 'selector':
                    parents = entry['selectors']  # type: ignore[assignment]
            selectors = combine_selectors(parents, selector_text)
            stack.append({'type': 'selector', 'selectors': selectors, 'properties': []})
            continue

        if line == '}':
            finished = stack.pop()
            if finished['type'] == 'selector':
                block = finished  # type: ignore[assignment]
                rule_body = '\n'.join(f"  {prop}" for prop in block['properties'])
                rule_text = f"{', '.join(block['selectors'])} {{\n{rule_body}\n}}"
                media_parent = next((item for item in reversed(stack) if item['type'] == 'media'), None)
                if media_parent is not None:
                    media_parent['children'].append(rule_text)
                else:
                    rules.append(('rule', rule_text))
            else:
                media = finished  # type: ignore[assignment]
                child_css = '\n\n'.join(media['children'])
                rules.append(('media', f"{media['query']} {{\n{indent_block(child_css)}\n}}"))
            continue

        selector_parent = next((item for item in reversed(stack) if item['type'] == 'selector'), None)
        if selector_parent is not None:
            selector_parent['properties'].append(line)

    return '\n\n'.join(text for _, text in rules)


def indent_block(text: str, prefix: str = '  ') -> str:
    return '\n'.join(f'{prefix}{line}' if line else '' for line in text.splitlines())


def compile_scss() -> None:
    source = load_scss(ENTRY)
    source, variables = extract_variables(source)
    source = replace_variables(source, variables)
    css = render_rules(source)
    OUTPUT.write_text(css + '\n', encoding='utf-8')
    print(f'[info] compiled {ENTRY.relative_to(ROOT)} -> {OUTPUT.relative_to(ROOT)}')


if __name__ == '__main__':
    compile_scss()
