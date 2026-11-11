import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "wordcount.py"


class WordcountTests(unittest.TestCase):
    def run_script(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *map(str, args)],
            capture_output=True,
            text=True,
        )

    def assert_error(self, result, message):
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")
        self.assertIn(message, result.stderr)
        self.assertNotIn("Traceback", result.stderr)

    def test_counts(self):
        cases = [
            ("", 0),
            (" \t\n\r\n  ", 0),
            ("hello world", 2),
            (" one  two\nthree\tfour\n", 4),
            ("café 世界\u2003hello\u00a0🌍", 4),
            ("one,two three!", 2),
        ]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "text file with spaces.txt"
            for text, count in cases:
                with self.subTest(text=text):
                    path.write_text(text, encoding="utf-8")
                    result = self.run_script(path)
                    self.assertEqual(result.returncode, 0)
                    self.assertEqual(result.stdout, f"{count}\n")
                    self.assertEqual(result.stderr, "")

    def test_file_errors(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            invalid = root / "invalid.txt"
            invalid.write_bytes(b"\xff\xfe")
            for path in (root / "missing.txt", root, invalid):
                with self.subTest(path=path):
                    result = self.run_script(path)
                    self.assert_error(result, "cannot read")
                    self.assertIn(str(path), result.stderr)

    def test_argument_errors(self):
        for args, message in [
            ([], "required"),
            (["one.txt", "two.txt"], "unrecognized arguments"),
        ]:
            with self.subTest(args=args):
                result = self.run_script(*args)
                self.assert_error(result, message)
                self.assertIn("usage:", result.stderr)

    def test_help(self):
        for flag in ("-h", "--help"):
            with self.subTest(flag=flag):
                result = self.run_script(flag)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stderr, "")
                for text in ("usage:", "path", "UTF-8"):
                    self.assertIn(text, result.stdout)


if __name__ == "__main__":
    unittest.main()
