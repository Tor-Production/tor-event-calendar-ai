#!/usr/bin/env python3
"""Check that release archives install the same combined plugin and skill."""
import hashlib
import json
import subprocess
import tarfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / 'skills' / 'nambli'
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
ARCHIVE = ROOT / 'dist' / f'nambli-skill-{VERSION}.zip'
PLUGIN_ARCHIVE = ROOT / 'dist' / f'tor-event-calendar-ai-plugin-{VERSION}.zip'
MCP_URL = 'https://nambli.com/mcp'
WORKFLOWS = ('nambli-content', 'nambli-publish')


def main():
    tracked = subprocess.run(
        ['git', '-c', f'safe.directory={ROOT.as_posix()}', 'ls-files', '-z', '--',
         SKILL.relative_to(ROOT).as_posix()],
        cwd=ROOT, check=True, capture_output=True,
    ).stdout
    paths = sorted(ROOT / Path(raw.decode('utf-8')) for raw in tracked.split(b'\0') if raw)
    expected = {f'{SKILL.name}/{path.relative_to(SKILL).as_posix()}': path for path in paths}
    if f'{SKILL.name}/SKILL.md' not in expected:
        raise AssertionError('The tracked skill must contain SKILL.md')

    workflow_sources = {}
    for skill_name in WORKFLOWS:
        skill_root = ROOT / 'skills' / skill_name
        for path in sorted(skill_root.rglob('*')):
            if path.is_symlink():
                raise AssertionError(f'Workflow contains a symlink: {path}')
            if path.is_file():
                workflow_sources[f'{skill_name}/{path.relative_to(skill_root).as_posix()}'] = path
        skill_archive = ROOT / 'dist' / f'{skill_name}-skill-{VERSION}.zip'
        members = {name: path for name, path in workflow_sources.items() if name.startswith(f'{skill_name}/')}
        with zipfile.ZipFile(skill_archive) as archive:
            if archive.namelist() != list(members) or archive.testzip():
                raise AssertionError(f'Workflow ZIP layout/corruption: {skill_name}')
            if f'{skill_name}/SKILL.md' not in members or f'{skill_name}/agents/openai.yaml' not in members:
                raise AssertionError(f'Workflow entrypoint/metadata missing: {skill_name}')
            for name, source in members.items():
                if archive.read(name) != source.read_bytes():
                    raise AssertionError(f'Workflow ZIP differs from source: {name}')

    with zipfile.ZipFile(ARCHIVE) as archive:
        names = archive.namelist()
        if names != list(expected):
            raise AssertionError(f'Unexpected skill ZIP entries: {names!r}')
        bad_entry = archive.testzip()
        if bad_entry:
            raise AssertionError(f'Corrupt skill ZIP entry: {bad_entry}')
        for name, path in expected.items():
            if archive.read(name) != path.read_bytes():
                raise AssertionError(f'Skill ZIP differs from tracked source: {name}')

    with zipfile.ZipFile(PLUGIN_ARCHIVE) as archive:
        names = archive.namelist()
        required = {
            'plugin.json', 'mcp.json', '.mcp.json',
            '.agents/plugins/marketplace.json',
            'skills/nambli/SKILL.md',
            'skills/nambli/agents/openai.yaml',
        }
        required.update(f'skills/{name}' for name in workflow_sources)
        if not required.issubset(names):
            raise AssertionError(f'Combined plugin ZIP is missing: {required - set(names)}')
        if archive.testzip():
            raise AssertionError('Combined plugin ZIP is corrupt')
        if len(names) != len(set(names)):
            raise AssertionError('Combined plugin ZIP has duplicate members')
        for name in names:
            source = ROOT / name
            if not source.is_file() or source.is_symlink() or archive.read(name) != source.read_bytes():
                raise AssertionError(f'Combined plugin ZIP differs from source: {name}')
        for name, path in expected.items():
            if archive.read(f'skills/{name}') != path.read_bytes():
                raise AssertionError(f'Combined plugin does not contain the standalone skill: {name}')
        for name, path in workflow_sources.items():
            if archive.read(f'skills/{name}') != path.read_bytes():
                raise AssertionError(f'Combined plugin does not contain the workflow: {name}')

        manifest = json.loads(archive.read('plugin.json'))
        codex_manifest = json.loads(archive.read('.codex-plugin/plugin.json'))
        claude_manifest = json.loads(archive.read('.claude-plugin/plugin.json'))
        package_lock = json.loads(archive.read('package-lock.json'))
        for companion, expected_name in ((codex_manifest, 'tor-event-calendar-ai'),
                                         (claude_manifest, 'nambli')):
            if companion['version'] != VERSION or companion['name'] != expected_name:
                raise AssertionError('Host plugin identity/version differs from its expected distribution')
        claude_marketplace = json.loads(archive.read('.claude-plugin/marketplace.json'))
        if claude_marketplace['plugins'][0]['name'] != claude_manifest['name']:
            raise AssertionError('Claude marketplace identity differs from its manifest')
        if package_lock['version'] != VERSION or package_lock['packages']['']['version'] != VERSION:
            raise AssertionError('Lockfile version differs from package.json')
        for public_manifest in (manifest, codex_manifest, claude_manifest):
            if ('apps' in public_manifest
                    or 'apps' in public_manifest.get('extensions', {}).get('com.openai', {})):
                raise AssertionError('Public release must not contain owner-private app bindings')
        if any(name.endswith('.app.json') or 'PRIVATE-ACCOUNT-SETUP' in name for name in names):
            raise AssertionError('Public release contains a private account setup file')
        skill_text = archive.read('skills/nambli/SKILL.md').decode('utf-8')
        if 'disable-model-invocation: true' not in skill_text:
            raise AssertionError('Skill must remain explicitly invoked')
        if 'allow_implicit_invocation: false' not in archive.read('skills/nambli/agents/openai.yaml').decode('utf-8'):
            raise AssertionError('Codex implicit skill invocation must remain disabled')
        for skill_name in WORKFLOWS:
            metadata = archive.read(f'skills/{skill_name}/agents/openai.yaml').decode('utf-8')
            frontmatter = archive.read(f'skills/{skill_name}/SKILL.md').decode('utf-8').split('---', 2)[1]
            if 'disable-model-invocation: true' in frontmatter or 'allow_implicit_invocation: false' in metadata:
                raise AssertionError(f'Workflow discovery must remain enabled: {skill_name}')
        submission = json.loads(archive.read('submission/chatgpt-app-submission.json'))
        review = manifest['extensions']['com.openai']['review']['test_cases']
        if len(review['positive']) != 5 or len(review['negative']) != 3:
            raise AssertionError('Review must contain exactly five positive and three negative cases')
        for cases, key in ((review['positive'], 'test_cases'),
                           (review['negative'], 'negative_test_cases')):
            field_map = {'prompt': 'user_prompt', 'expected_behavior': 'expected_output'}
            adapted = [{field_map.get(field, field): value
                        for field, value in case.items()} for case in cases]
            if key == 'negative_test_cases':
                for case in adapted:
                    case['expected_output'] = case['description']
            if submission[key] != adapted:
                raise AssertionError('Submission case metadata differs from the root plugin')
        if submission['tools']['move_event']['annotations']['destructiveHint'] is not True:
            raise AssertionError('Moving an event overwrites its previous schedule')
        mcp = json.loads(archive.read('mcp.json'))['mcpServers']['nambli']
        legacy_mcp = json.loads(archive.read('.mcp.json'))['mcpServers']['nambli']
        site = json.loads(archive.read('docs/install-config.json'))
        dependency = archive.read('skills/nambli/agents/openai.yaml').decode('utf-8')
        marketplace = json.loads(archive.read('.agents/plugins/marketplace.json'))
        if marketplace['name'] != 'nambli' or marketplace['plugins'][0]['name'] != 'tor-event-calendar-ai':
            raise AssertionError('Repository marketplace does not expose the nambli plugin')
        for name, original in [('icon.png', 'icon-dark.png'), ('logo.png', 'logo-dark.png')]:
            if archive.read(f'skills/nambli/assets/{name}') != archive.read(f'assets/{original}'):
                raise AssertionError('Skill artwork differs from the approved nambli artwork')
        if manifest['version'] != VERSION or manifest['name'] != 'tor-event-calendar-ai':
            raise AssertionError('Plugin identity/version differs from package.json')
        if mcp != {'type': 'streamable-http', 'url': MCP_URL}:
            raise AssertionError('Portable MCP definition differs from the production endpoint')
        if legacy_mcp != {'type': 'http', 'url': MCP_URL}:
            raise AssertionError('Legacy MCP definition differs from the production endpoint')
        if (site['mcpURL'] != MCP_URL or site['siteURL'] != 'https://nambli.com/connect-ai'
                or manifest['homepage'] != 'https://nambli.com' or site['calendarURL'] != 'https://nambli.com/'):
            raise AssertionError('Installation guide configuration differs from nambli metadata')
        interface = manifest['extensions']['com.openai']['interface']
        if (interface['displayName'] != 'nambli' or interface['websiteURL'] != 'https://nambli.com'
                or interface['privacyPolicyURL'] != 'https://nambli.com/privacy'
                or interface['termsOfServiceURL'] != 'https://nambli.com/terms'
                or site['listingStatus'] != 'draft' or site['listingURL'] is not None):
            raise AssertionError('nambli identity or unpublished listing state differs')
        if 'value: "nambli"' not in dependency or f'url: "{MCP_URL}"' not in dependency:
            raise AssertionError('Skill dependency does not match packaged MCP server')

    checksums = {}
    for line in (ROOT / 'dist' / 'SHA256SUMS').read_text(encoding='utf-8').splitlines():
        digest, name = line.split('  ', 1)
        checksums[name] = digest
    tarball = ROOT / 'dist' / f'tor-event-calendar-ai-{VERSION}.tgz'
    with tarfile.open(tarball) as archive:
        for name, source in {**expected, **workflow_sources}.items():
            member = archive.getmember(f'package/skills/{name}')
            if not member.isfile() or archive.extractfile(member).read() != source.read_bytes():
                raise AssertionError(f'npm tarball differs from skill source: {name}')
    for artifact in (ARCHIVE, PLUGIN_ARCHIVE, tarball,
                     *(ROOT / 'dist' / f'{name}-skill-{VERSION}.zip' for name in WORKFLOWS)):
        if checksums.get(artifact.name) != hashlib.sha256(artifact.read_bytes()).hexdigest():
            raise AssertionError(f'Incorrect SHA256SUMS entry: {artifact.name}')

    print(json.dumps({'result': 'PASS', 'skill': str(ARCHIVE),
                      'plugin': str(PLUGIN_ARCHIVE), 'skill_files': len(expected),
                      'workflow_files': len(workflow_sources)}))


if __name__ == '__main__':
    main()
