#!/usr/bin/env python3
"""Cursor package regression checks; synthetic files only, never a native pass."""
import json
import shutil
import tempfile
import unittest
import zipfile
from pathlib import Path

import cursor_plugin as cursor


class CursorPackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='nambli-cursor-package-')
        self.root = Path(self.temp.name) / 'source'
        for relative in cursor.export_paths():
            destination = self.root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(cursor.ROOT / relative, destination)

    def tearDown(self):
        self.temp.cleanup()

    def edit_json(self, relative, change):
        path = self.root / relative
        data = json.loads(path.read_text(encoding='utf-8'))
        change(data)
        path.write_text(json.dumps(data) + '\n', encoding='utf-8')

    def test_deterministic_archive_is_complete_and_matches_canonical_shared_skills(self):
        first = cursor.build(self.root, Path(self.temp.name) / 'a')
        second = cursor.build(self.root, Path(self.temp.name) / 'b')
        self.assertEqual(first['sha256'], second['sha256'])
        with zipfile.ZipFile(Path(self.temp.name) / 'a' / first['archive']) as archive:
            self.assertIsNone(archive.testzip())
            self.assertEqual(archive.namelist(), cursor.export_paths(self.root))
            self.assertEqual(len(archive.namelist()), len(set(archive.namelist())))
            self.assertNotIn('plugin.json', archive.namelist())
            self.assertNotIn('package.json', archive.namelist())
            for relative in cursor.export_paths(self.root):
                self.assertEqual(archive.read(relative), (cursor.ROOT / relative).read_bytes())
            for unwanted in ('submission/', 'receipts/', 'work/', '.codex-plugin/', '.claude-plugin/'):
                self.assertFalse(any(name.startswith(unwanted) for name in archive.namelist()))

    def test_changed_endpoint_or_embedded_header_fails_validation(self):
        self.edit_json('ecosystems/cursor/mcp.json', lambda data: data['mcpServers']['nambli'].update(headers={'Authorization': 'synthetic forbidden credential'}))
        with self.assertRaisesRegex(ValueError, 'canonical remote'):
            cursor.validate(self.root)

    def test_path_escape_and_missing_shared_skill_fail_validation(self):
        self.edit_json(cursor.MANIFEST, lambda data: data.update(skills=['../../outside']))
        with self.assertRaisesRegex(ValueError, 'routing'):
            cursor.validate(self.root)
        with self.assertRaisesRegex(ValueError, 'remain inside'):
            cursor.safe_path(self.root, '../outside')

    def test_removed_adapter_reference_target_is_rejected(self):
        (self.root / 'ecosystems/cursor/JOURNAL.md').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing package'):
            cursor.validate(self.root)

    def test_unknown_extra_executable_and_private_binding_are_rejected(self):
        (self.root / 'ecosystems/cursor/rules/unexpected.exe').write_bytes(b'synthetic')
        with self.assertRaisesRegex(ValueError, 'Unexpected package file type'):
            cursor.validate(self.root)
        self.edit_json(cursor.MANIFEST, lambda data: data.update(apps={'id': 'owner-private'}))
        with self.assertRaisesRegex(ValueError, 'private bindings'):
            cursor.validate(self.root)

    def test_runtime_rule_declares_a_real_always_apply_boolean_without_enabling_core_skill(self):
        path = self.root / 'ecosystems/cursor/rules/nambli-runtime.mdc'
        source = path.read_text(encoding='utf-8')
        self.assertIs(cursor.rule_metadata(source)['alwaysApply'], True)
        core = (self.root / 'skills/nambli/SKILL.md').read_text(encoding='utf-8')
        self.assertIn('disable-model-invocation: true', core.split('---', 2)[1])
        path.write_text(source.replace('alwaysApply: true', 'alwaysApply: false'), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'must always load'):
            cursor.validate(self.root)
        with self.assertRaisesRegex(ValueError, 'YAML Boolean'):
            cursor.rule_metadata(source.replace('alwaysApply: true', 'alwaysApply: "true"'))
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            cursor.rule_metadata(source.replace('alwaysApply: true', 'alwaysApply: true\nalwaysApply: false'))


if __name__ == '__main__':
    unittest.main()
