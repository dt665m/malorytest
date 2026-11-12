"""Tests for counting words in literal command-line arguments."""

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from wordcount import count_words


SCRIPT = Path(__file__).with_name("wordcount.py")


class WordCountTests(unittest.TestCase):
    def test_count_words(self):
        cases = [
            ([], 0),
            ([""], 0),
            ([" \t\n", ""], 0),
            (["some", "words", "here"], 3),
            (["some words", "here"], 3),
            (["  one\ttwo\nthree  ", "four\r\nfive"], 5),
            (["hello,world", "isn't", "hyphenated-word"], 3),
            (["café\u2003世界", "こんにちは"], 3),
        ]
        for arguments, expected in cases:
            with self.subTest(arguments=arguments):
                self.assertEqual(count_words(arguments), expected)

    def run_script(self, arguments):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *arguments],
            capture_output=True,
            text=True,
            check=True,
        )

    def test_command_line(self):
        cases = [
            ([], "0\n"),
            (["some", "words", "here"], "3\n"),
            (["some words", "here"], "3\n"),
            (["", " \t\n"], "0\n"),
            (["one\ttwo\nthree", "four"], "4\n"),
            (["--help", "-n"], "2\n"),
        ]
        for arguments, expected in cases:
            with self.subTest(arguments=arguments):
                result = self.run_script(arguments)
                self.assertEqual(result.stdout, expected)
                self.assertEqual(result.stderr, "")

    def test_existing_file_is_counted_as_argument_not_read(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "input.txt"
            path.write_text("one two three four five", encoding="utf-8")
            result = self.run_script([str(path)])
            self.assertEqual(result.stdout, f"{len(str(path).split())}\n")
            self.assertEqual(result.stderr, "")


if __name__ == "__main__":
    unittest.main()
