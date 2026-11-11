"""Persistent CLI tests; run with python3 -m unittest discover -v."""

from pathlib import Path
import subprocess
import sys
import unittest


SCRIPT = Path(__file__).with_name("palindrome.py")


class PalindromeCLITests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=False,
        )

    def assert_result(self, text, expected):
        result = self.run_cli("--", text)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, expected + "\n")
        self.assertEqual(result.stderr, "")

    def test_odd_even_and_negative(self):
        for text, expected in [
            ("racecar", "Palindrome"),
            ("abba", "Palindrome"),
            ("hello", "Not a palindrome"),
        ]:
            with self.subTest(text=text):
                self.assert_result(text, expected)

    def test_exact_case_whitespace_and_punctuation(self):
        for text, expected in [
            ("Racecar", "Not a palindrome"),
            ("a!a", "Palindrome"),
            ("a! a", "Not a palindrome"),
            ("a a", "Palindrome"),
            (" aa", "Not a palindrome"),
        ]:
            with self.subTest(text=text):
                self.assert_result(text, expected)

    def test_empty_single_and_unicode_code_points(self):
        for text, expected in [
            ("", "Palindrome"),
            ("x", "Palindrome"),
            ("éxé", "Palindrome"),
            ("😀x😀", "Palindrome"),
            ("éxe\u0301", "Not a palindrome"),
            ("e\u0301", "Not a palindrome"),
            ("e\u0301e", "Palindrome"),
        ]:
            with self.subTest(text=text):
                self.assert_result(text, expected)

    def test_plain_positional_argument(self):
        result = self.run_cli("abba")
        self.assertEqual((result.returncode, result.stdout, result.stderr),
                         (0, "Palindrome\n", ""))

    def test_dash_prefixed_text(self):
        for text, expected in [
            ("-a-", "Palindrome"),
            ("-ab", "Not a palindrome"),
            ("--", "Palindrome"),
            ("--help", "Not a palindrome"),
        ]:
            with self.subTest(text=text):
                self.assert_result(text, expected)

    def test_help(self):
        for flag in ("-h", "--help"):
            with self.subTest(flag=flag):
                result = self.run_cli(flag)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stderr, "")
                self.assertTrue(result.stdout.endswith("\n"))
                for phrase in ("usage:", "case-sensitive", "code-point",
                               "Whitespace", "punctuation", "no normalization",
                               "Empty text", "--"):
                    self.assertIn(phrase, result.stdout)

    def test_argument_errors(self):
        for args in ((), ("a", "b"), ("--",), ("--", "a", "b"),
                     ("--unknown-option",)):
            with self.subTest(args=args):
                result = self.run_cli(*args)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, "")
                self.assertTrue(result.stderr.startswith("usage:"))
                self.assertIn("error:", result.stderr)
                self.assertTrue(result.stderr.endswith("\n"))
                self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
