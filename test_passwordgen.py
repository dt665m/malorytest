import contextlib
import io
from pathlib import Path
import re
import runpy
import string
import subprocess
import sys
import unittest
from unittest.mock import call, patch


SCRIPT = Path(__file__).with_name("passwordgen.py")


class PasswordGeneratorTests(unittest.TestCase):
    def test_sixteen_secure_choices(self):
        expected = "aZ09" * 4
        alphabet = string.ascii_letters + string.digits
        stdout = io.StringIO()
        stderr = io.StringIO()
        with patch("secrets.choice", side_effect=expected) as choice:
            with contextlib.redirect_stdout(stdout):
                with contextlib.redirect_stderr(stderr):
                    runpy.run_path(str(SCRIPT), run_name="__main__")
        self.assertEqual(choice.call_args_list, [call(alphabet)] * 16)
        self.assertEqual(stdout.getvalue(), expected + "\n")
        self.assertEqual(stderr.getvalue(), "")

    def test_real_cli(self):
        for attempt in range(20):
            with self.subTest(attempt=attempt):
                result = subprocess.run(
                    [sys.executable, str(SCRIPT)],
                    capture_output=True,
                    timeout=5,
                )
                self.assertEqual(result.returncode, 0)
                self.assertTrue(result.stderr == b"", "Unexpected stderr")
                self.assertTrue(
                    re.fullmatch(rb"[a-zA-Z0-9]{16}\n", result.stdout),
                    "Expected exactly 16 ASCII alphanumeric characters and a newline",
                )


if __name__ == "__main__":
    unittest.main()
