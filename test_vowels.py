"""Persistent CLI tests; run with python3 -m unittest discover -v."""

from pathlib import Path
import subprocess
import sys
import unittest


SCRIPT = Path(__file__).with_name("vowels.py")


class VowelsCLITests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=False,
        )

    def assert_count(self, text, expected):
        result = self.run_cli("--", text)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, f"{expected}\n")
        self.assertEqual(result.stderr, "")

    def test_all_vowels_in_both_cases(self):
        for vowel in "aeiouAEIOU":
            with self.subTest(vowel=vowel):
                self.assert_count(vowel, 1)
        self.assert_count("aeiouAEIOU", 10)

    def test_repeated_and_mixed_vowels(self):
        self.assert_count("aaaEEEiiiOOOuuu", 15)
        self.assert_count("Hello, WORLD!", 3)

    def test_consonants_y_punctuation_and_accents(self):
        for text in ("bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ",
                     "yY", "123!?.,-", "áéíóúÀÉÎÖÜ", "İı"):
            with self.subTest(text=text):
                self.assert_count(text, 0)

    def test_empty_spaces_and_unicode(self):
        for text, expected in [
            ("", 0),
            (" \t\n ", 0),
            ("a E i O u", 5),
            ("a😀E中ï", 2),
            ("e\u0301", 1),
        ]:
            with self.subTest(text=text):
                self.assert_count(text, expected)

    def test_plain_positional_with_spaces(self):
        result = self.run_cli("Hello world")
        self.assertEqual((result.returncode, result.stdout, result.stderr),
                         (0, "3\n", ""))

    def test_dash_prefixed_text(self):
        for text, expected in [("-AEiou", 5), ("--", 0), ("--help", 1)]:
            with self.subTest(text=text):
                self.assert_count(text, expected)

    def test_help(self):
        for flag in ("-h", "--help"):
            with self.subTest(flag=flag):
                result = self.run_cli(flag)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stderr, "")
                self.assertTrue(result.stdout.endswith("\n"))
                for phrase in ("usage:", "ASCII", "a, e, i, o, u",
                               "case-insensitively", "letter y", "accented",
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
