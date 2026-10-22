#!/usr/bin/env python3
"""Static ChatGPT candidate checks; no upload, OAuth, calendar or social calls."""
import hashlib
import io
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

try:
    import yaml
except ImportError as exc:
    raise SystemExit('YAML validation needs PyYAML: python -m pip install PyYAML') from exc

import package as packaging

ROOT = packaging.ROOT


class ChatGPTPackageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files = packaging.chatgpt_files()
        # Keep disposable copies inside the checkout: some desktop sandboxes
        # expose an OS temp directory whose children are not writable.
        cls.temp_base = ROOT / 'dist' / 'chatgpt-test-fixtures'
        cls.temp_base.mkdir(parents=True, exist_ok=True)

    def fixture(self):
        directory = tempfile.TemporaryDirectory(prefix='nambli-chatgpt-', dir=self.temp_base)
        self.addCleanup(directory.cleanup)
        root = Path(directory.name) / 'plugin'
        for name, data in self.files.items():
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        return root

    def test_exact_portable_components_and_resources(self):
        files = self.files
        self.assertEqual(set(files), {name for name in files if name in ('plugin.json', 'mcp.json', 'LICENSE')
                         or name.startswith(('assets/', *(f'skills/{s}/' for s in packaging.SKILL_NAMES)))})
        self.assertFalse(any('marketplace' in name or name.startswith(('.', 'src/', 'scripts/', 'ecosystems/'))
                             for name in files))
        manifest = json.loads(files['plugin.json'])
        self.assertEqual(manifest['name'], 'tor-event-calendar-ai')
        self.assertEqual(manifest['version'], packaging.VERSION)
        self.assertEqual(manifest['$schema'], 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json')
        extension = manifest['extensions']['com.openai']
        self.assertNotIn('apps', extension)
        self.assertNotIn('hooks', extension)
        self.assertEqual(json.loads(files['mcp.json']), {
            '$schema': 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
            'mcpServers': {'nambli': {'type': 'streamable-http', 'url': 'https://nambli.com/mcp'}}})
        for name, data in files.items():
            self.assertEqual(data, (ROOT / name).read_bytes(), name)
            if name.endswith('.json'):
                self.assertIsInstance(json.loads(data), dict, name)
        for skill in packaging.SKILL_NAMES:
            body = files[f'skills/{skill}/SKILL.md'].decode('utf-8')
            self.assertTrue(body.startswith('---\n'))
            metadata = yaml.safe_load(body.split('---', 2)[1])
            self.assertEqual(metadata['name'], skill)
            self.assertIsInstance(metadata['description'], str)
            agent = yaml.safe_load(files[f'skills/{skill}/agents/openai.yaml'])
            self.assertIsInstance(agent, dict)
            self.assertEqual(agent['dependencies']['tools'][0]['url'], 'https://nambli.com/mcp')
            if skill == 'nambli':
                self.assertIs(metadata['disable-model-invocation'], True)
                self.assertIs(agent['policy']['allow_implicit_invocation'], False)
            else:
                self.assertIsNot(metadata.get('disable-model-invocation'), True)
                self.assertIsNot(agent.get('policy', {}).get('allow_implicit_invocation'), False)
            for key in ('icon_small', 'icon_large'):
                if path := agent['interface'].get(key):
                    name = f'skills/{skill}/{path.removeprefix("./")}'
                    self.assertIn(name, files)

    def test_deterministic_archive_and_checksum(self):
        with tempfile.TemporaryDirectory(prefix='nambli-chatgpt-zip-', dir=self.temp_base) as directory:
            output = Path(directory) / packaging.CHATGPT_FILENAME
            first = packaging.build_chatgpt(output=output)
            first_bytes = output.read_bytes()
            second = packaging.build_chatgpt(output=output)
            self.assertEqual(first, second)
            self.assertEqual(first_bytes, output.read_bytes())
            self.assertEqual(first['sha256'], hashlib.sha256(first_bytes).hexdigest())
            self.assertEqual(output.with_suffix('.zip.sha256').read_text(encoding='utf-8'), f'{first["sha256"]}  {output.name}\n')
            with zipfile.ZipFile(output) as archive:
                self.assertIsNone(archive.testzip())
                self.assertEqual(archive.namelist(), sorted(self.files))
                for name, data in self.files.items():
                    self.assertEqual(archive.read(name), data)

    def test_missing_relative_resource_blocks_build(self):
        root = self.fixture()
        (root / 'skills/nambli/references/connections.md').unlink()
        with self.assertRaisesRegex(ValueError, 'Unpackaged skill resource'):
            packaging.chatgpt_files(root)

    def test_outside_resource_blocks_build(self):
        root = self.fixture()
        path = root / 'skills/nambli/SKILL.md'
        path.write_text(path.read_text(encoding='utf-8') + '\n[private](../../../outside.md)\n', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Resource escapes plugin'):
            packaging.chatgpt_files(root)

    def test_private_app_and_hook_declarations_block_build(self):
        for key in ('apps', 'hooks'):
            with self.subTest(key=key):
                root = self.fixture()
                path = root / 'plugin.json'
                manifest = json.loads(path.read_bytes())
                manifest['extensions']['com.openai'][key] = './private.json'
                path.write_text(json.dumps(manifest), encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'private App mappings or local hooks'):
                    packaging.chatgpt_files(root)

    def test_private_app_id_or_token_blocks_build(self):
        for value in ('asdk_app_' + 'a' * 32, 'access_token: "' + 'synthetic' * 5 + '"',
                      '-----BEGIN PRIVATE KEY-----'):
            with self.subTest(kind=value.split(':')[0][:20]):
                root = self.fixture()
                (root / 'skills/nambli/references/unsafe.md').write_text(value, encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'Private App ID or credential-like'):
                    packaging.chatgpt_files(root)

    def test_private_or_marketplace_files_block_build(self):
        for name in ('.env', 'credentials.json', 'marketplace.json', '.app.json'):
            with self.subTest(name=name):
                root = self.fixture()
                (root / 'skills/nambli' / name).write_text('{}', encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'Private or marketplace file'):
                    packaging.chatgpt_files(root)

    def test_unsafe_paths_rejected_without_filesystem_access(self):
        for name in ('../private.json', '/private.json', 'C:/private.json', 'skills\\private.json',
                     'skills//private.json', 'skills/./private.json', ' plugin.json'):
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, 'Unsafe package path'):
                packaging.contained_file(ROOT, name)

    def test_symlink_resource_is_not_followed(self):
        root = self.fixture()
        path = root / 'skills/nambli/references/linked.md'
        try:
            path.symlink_to(root / 'LICENSE')
        except (OSError, NotImplementedError):
            self.skipTest('This OS account cannot create symbolic links')
        with self.assertRaisesRegex(ValueError, 'Symlink excluded'):
            packaging.chatgpt_files(root)

    def test_symlink_directory_guard_without_os_privilege(self):
        root = self.fixture()
        linked = root / 'skills/nambli/references'
        original = Path.is_symlink
        with patch.object(Path, 'is_symlink', lambda path: path == linked or original(path)):
            with self.assertRaisesRegex(ValueError, 'Symlink excluded'):
                packaging.chatgpt_files(root)

    def test_default_source_target_retains_broad_distribution(self):
        tracked = subprocess.run(['git', '-c', f'safe.directory={ROOT.as_posix()}',
                                  'ls-files', '-z', '--', *packaging.ALLOW],
                                 cwd=ROOT, check=True, capture_output=True).stdout
        names = {name.decode('utf-8') for name in tracked.split(b'\0') if name}
        with tempfile.TemporaryDirectory(prefix='source-package-', dir=self.temp_base) as directory:
            root = Path(directory) / 'source'
            for name in names:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / name, path)
            dist = root / 'dist'
            dist.mkdir()
            # The source builder only hashes the separately produced CLI tarball;
            # this fixture checks archive routing, not npm packaging.
            (dist / f'tor-event-calendar-ai-{packaging.VERSION}.tgz').write_bytes(b'synthetic tarball fixture')
            with patch.object(packaging, 'ROOT', root), patch.object(packaging, 'DIST', dist), \
                    patch.object(packaging.subprocess, 'run', return_value=SimpleNamespace(stdout=tracked)), \
                    patch.object(sys, 'argv', ['package.py']), redirect_stdout(io.StringIO()):
                packaging.main()
            with zipfile.ZipFile(dist / f'tor-event-calendar-ai-plugin-{packaging.VERSION}.zip') as archive:
                self.assertEqual(set(archive.namelist()), names)
                for name in ('src/cli.mjs', '.agents/plugins/marketplace.json',
                             '.claude-plugin/plugin.json', '.codex-plugin/plugin.json'):
                    self.assertIn(name, archive.namelist())
            self.assertFalse((dist / packaging.CHATGPT_FILENAME).exists())
            for skill in packaging.SKILL_NAMES:
                with zipfile.ZipFile(dist / f'{skill}-skill-{packaging.VERSION}.zip') as archive:
                    self.assertIn(f'{skill}/SKILL.md', archive.namelist())

    def test_host_guidance_does_not_turn_local_install_into_cloud_app(self):
        body = self.files['skills/nambli/references/connections.md'].decode('utf-8')
        self.assertIn('## Identify the current host', body)
        self.assertIn('does not create a ChatGPT account App', body)
        self.assertIn('ChatGPT cloud cannot access the local keychain', body)


if __name__ == '__main__':
    unittest.main(verbosity=2)
