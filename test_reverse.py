import subprocess
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("reverse.py")


class ReverseTests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, "-X", "utf8", str(SCRIPT), *args],
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=False,
        )

    def test_valid_text(self):
        cases = [
            ("hello", "olleh\n"),
            ("", "\n"),
            ("x", "x\n"),
            ("  Hello, world!  ", "  !dlrow ,olleH  \n"),
            ("café世界", "界世éfac\n"),
            ("A😀🐍B", "B🐍😀A\n"),
            ("a\u0301b", "b\u0301a\n"),
        ]
        for value, expected in cases:
            with self.subTest(value=value):
                result = self.run_cli(value)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stdout, expected)
                self.assertEqual(result.stderr, "")

    def test_end_of_options(self):
        for value, expected in [("--help", "pleh--\n"), ("-hello", "olleh-\n")]:
            with self.subTest(value=value):
                result = self.run_cli("--", value)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stdout, expected)
                self.assertEqual(result.stderr, "")

    def test_help(self):
        for flag in ("-h", "--help"):
            with self.subTest(flag=flag):
                result = self.run_cli(flag)
                self.assertEqual(result.returncode, 0)
                self.assertTrue(result.stdout.startswith("usage: reverse.py"))
                self.assertIn("Print a string reversed.", result.stdout)
                self.assertIn("text", result.stdout)
                self.assertEqual(result.stderr, "")

    def test_invalid_arguments(self):
        for args in ((), ("one", "two"), ("-xyz",), ("--unknown",), ("--",)):
            with self.subTest(args=args):
                result = self.run_cli(*args)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, "")
                self.assertTrue(result.stderr.startswith("usage: reverse.py"))
                self.assertIn("error:", result.stderr)
                self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
