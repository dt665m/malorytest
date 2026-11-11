"""Run with: python3 -m unittest discover -v."""

from pathlib import Path
import subprocess
import sys
import unittest


SCRIPT = Path(__file__).with_name("weather_emoji.py")
EXPECTED = {
    "sunny": "\u2600\ufe0f",
    "rainy": "\U0001f327\ufe0f",
    "cloudy": "\u2601\ufe0f",
    "snowy": "\U0001f328\ufe0f",
    "stormy": "\u26c8\ufe0f",
    "windy": "\U0001f32c\ufe0f",
}


class WeatherEmojiTests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            capture_output=True,
            text=True,
            encoding="utf-8",
        )

    def assert_success(self, result, emoji):
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, emoji + "\n")
        self.assertEqual(result.stderr, "")

    def assert_error(self, result, message):
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, "")
        self.assertIn("usage:", result.stderr)
        self.assertIn(message, result.stderr)
        self.assertNotIn("Traceback", result.stderr)

    def test_exact_unicode_for_all_words(self):
        for word, emoji in EXPECTED.items():
            with self.subTest(word=word):
                self.assert_success(self.run_cli(word), emoji)

    def test_case_insensitive(self):
        for word, emoji in EXPECTED.items():
            mixed = "".join(
                char.upper() if index % 2 == 0 else char
                for index, char in enumerate(word)
            )
            for spelling in (word.upper(), mixed):
                with self.subTest(word=spelling):
                    self.assert_success(self.run_cli(spelling), emoji)

    def test_unknown_word(self):
        for word in ("foggy", ""):
            with self.subTest(word=word):
                result = self.run_cli(word)
                self.assert_error(result, "invalid choice:")
                self.assertIn(repr(word), result.stderr)
                for choice in EXPECTED:
                    self.assertIn(choice, result.stderr)

    def test_missing_argument(self):
        self.assert_error(self.run_cli(), "the following arguments are required:")

    def test_extra_argument(self):
        result = self.run_cli("sunny", "rainy")
        self.assert_error(result, "unrecognized arguments: rainy")

    def test_help(self):
        for flag in ("-h", "--help"):
            with self.subTest(flag=flag):
                result = self.run_cli(flag)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stderr, "")
                self.assertIn("usage:", result.stdout)
                self.assertIn("case-insensitive", result.stdout)
                for choice in EXPECTED:
                    self.assertIn(choice, result.stdout)


if __name__ == "__main__":
    unittest.main()
