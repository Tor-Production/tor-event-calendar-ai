"""Offline artifact/regression checks; fixtures never touch real accounts."""
import copy
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

sys.dont_write_bytecode = True
import claude_code as host


class ClaudeCodeTests(unittest.TestCase):
    def setUp(self):
        work = host.ROOT / 'work'
        work.mkdir(exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(prefix='claude-tests-', dir=work)
        self.root = Path(self.temporary.name) / 'source'
        self.root.mkdir()
        for relative in ['.claude-plugin', 'skills', 'ecosystems/claude-code']:
            shutil.copytree(host.ROOT / relative, self.root / relative)
        for relative in ['package.json', '.mcp.json', 'LICENSE']:
            shutil.copyfile(host.ROOT / relative, self.root / relative)
        self.git('init', '--quiet')
        self.git('add', '.')

    def tearDown(self):
        self.temporary.cleanup()

    def write_json(self, relative, data):
        (self.root / relative).write_text(json.dumps(data), encoding='utf-8')

    def git(self, *args):
        subprocess.run(['git', '-c', f'safe.directory={self.root.as_posix()}', *args], cwd=self.root,
                       capture_output=True, check=True)

    def test_package_and_determinism(self):
        first = host.build(self.root)
        second = host.build(self.root)
        self.assertEqual(first, second)
        archive = self.root / 'dist/claude-code' / first['archive']
        self.assertEqual(hashlib.sha256(archive.read_bytes()).hexdigest(), first['sha256'])
        with zipfile.ZipFile(archive) as result:
            self.assertIsNone(result.testzip())
            self.assertEqual(result.namelist(), list(first['files']))
            for name in result.namelist():
                self.assertEqual(result.read(name), (self.root / name).read_bytes())
            self.assertIn('skills/tor-event-calendar/references/claude-code.md', result.namelist())
            self.assertNotIn('.claude-plugin/marketplace.json', result.namelist())
            self.assertNotIn('plugin.json', result.namelist())  # No OpenAI distribution copy.
            self.assertFalse(any('work/' in name or 'node_modules/' in name for name in result.namelist()))

    def test_native_transport_and_credentials_drift(self):
        for entry in [{'type': 'stdio', 'url': host.MCP_URL},
                      {'type': 'http', 'url': 'https://other.test/mcp'},
                      {'type': 'http', 'url': host.MCP_URL, 'headers': {'Authorization': 'test-only'}}]:
            with self.subTest(entry=entry):
                self.write_json('.mcp.json', {'mcpServers': {'nembli': entry}})
                with self.assertRaisesRegex(ValueError, 'HTTP MCP config drift'):
                    host.validate(self.root)

    def test_skill_implicit_selection_and_duplicate_yaml_rejected(self):
        path = self.root / host.SKILL / 'SKILL.md'
        original = path.read_text(encoding='utf-8')
        for text in [original.replace('disable-model-invocation: true', 'disable-model-invocation: false'),
                     original.replace('disable-model-invocation: true\n', ''),
                     original.replace('disable-model-invocation: true',
                                      'disable-model-invocation: true\ndisable-model-invocation: true')]:
            path.write_text(text, encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'disable implicit invocation exactly once'):
                host.validate(self.root)

    def test_marketplace_cannot_escape_or_change_id(self):
        original = host.read_json(self.root, '.claude-plugin/marketplace.json')
        for changes in [{'source': '../other'}, {'name': 'renamed-plugin'}]:
            data = copy.deepcopy(original)
            data['plugins'][0].update(changes)
            self.write_json('.claude-plugin/marketplace.json', data)
            with self.assertRaisesRegex(ValueError, 'existing root plugin'):
                host.validate(self.root)

    def test_export_rejects_unexpected_file(self):
        (self.root / host.HOST / 'credentials.tmp').write_text('test-only', encoding='utf-8')
        self.assertNotIn(host.HOST / 'credentials.tmp', host.export_paths(self.root))
        self.git('add', '.')
        with self.assertRaisesRegex(ValueError, 'Unexpected exported file'):
            host.build(self.root)

    def test_fixture_types_reject_file_json_values(self):
        data = host.read_json(self.root, host.HOST / 'fixtures/post-draft.json')
        data['customFields']['image'] = 'local/path.png'
        self.write_json(host.HOST / 'fixtures/post-draft.json', data)
        with self.assertRaisesRegex(ValueError, 'embeds a File value'):
            host.validate(self.root)

    def metadata(self):
        return [(401, {'WWW-Authenticate': 'Bearer resource_metadata="https://nembli.com/.well-known/oauth-protected-resource/mcp"'}, b''),
                (200, {}, json.dumps({'resource': host.MCP_URL, 'authorization_servers': [host.ISSUER]}).encode()),
                (200, {}, json.dumps({'issuer': host.ISSUER, 'scopes_supported': ['calendar.read', 'calendar.manage', 'offline_access'],
                                     'code_challenge_methods_supported': ['S256'],
                                     'registration_endpoint': host.ISSUER + '/register'}).encode())]

    def test_probe_requires_auth_and_uses_only_public_metadata(self):
        with patch.object(host, 'public_request', side_effect=self.metadata()) as request:
            result = host.probe()
        self.assertFalse(result['accountAccess'])
        self.assertFalse(result['nativeAcceptance'])
        self.assertEqual(len(request.call_args_list), 3)
        self.assertEqual(json.loads(request.call_args_list[0].args[1])['method'], 'initialize')
        self.assertEqual([call.args[0] for call in request.call_args_list[1:]],
                         ['https://nembli.com/.well-known/oauth-protected-resource/mcp',
                          'https://nembli.com/.well-known/oauth-authorization-server/api/v1/auth'])

    def test_probe_rejects_missing_auth_or_foreign_origin(self):
        for records in [[(200, {}, b'{}')], [(403, {}, b'{}')],
                        [self.metadata()[0], (200, {}, json.dumps({'resource': 'https://other.test/mcp',
                                                                'authorization_servers': [host.ISSUER]}).encode())]]:
            with patch.object(host, 'public_request', side_effect=records):
                with self.assertRaises(ValueError):
                    host.probe()

    def test_probe_does_not_follow_redirects(self):
        self.assertIsNone(host.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://other.test'))

    def test_fixture_planner_and_local_skill_install(self):
        # Exercise the real shared planner/installer with an isolated directory and no keychain.
        script = """
        import assert from 'node:assert/strict';
        import {readFile} from 'node:fs/promises';
        import {planCreate} from './src/plan.mjs';
        import {installSkill} from './src/cli.mjs';
        const input=JSON.parse(await readFile('ecosystems/claude-code/fixtures/post-draft.json','utf8'));
        const planned=planCreate(input,{});
        assert.equal(planned.ready,true,JSON.stringify(planned.questions));
        assert.equal(planned.payload.timeZone,'Europe/Kyiv');
        assert.equal(Date.parse(planned.payload.scheduledAt),Date.parse(input.scheduledAt));
        assert.equal(planned.payload.customFieldTypes.image,'File');
        assert.equal(planned.payload.publishingSettings.platform,'linkedin');
        for(let i=0;i<2;i++){
          const installed=await installSkill('claude',{directory:process.argv[1]});
          const text=await readFile(installed.target+'/SKILL.md','utf8');
          assert.equal((text.match(/^disable-model-invocation: true$/gm)||[]).length,1);
          assert.ok(text.includes('(references/claude-code.md)'));
          await readFile(installed.target+'/references/claude-code.md');
        }
        console.log('PASS: real planner and repeat Claude skill install, no account access');
        """
        run = subprocess.run(['node', '--input-type=module', '-e', script, str(self.root / 'installed')],
                             cwd=host.ROOT, text=True, capture_output=True)
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)


if __name__ == '__main__':
    unittest.main(verbosity=2)
