import contextlib
import io
from pathlib import Path
import runpy
import subprocess
import sys
import unittest
from unittest.mock import call, patch


SCRIPT = Path(__file__).with_name("dice.py")


class DiceTests(unittest.TestCase):
    def test_all_ordered_die_pairs(self):
        for first in range(1, 7):
            for second in range(1, 7):
                with self.subTest(first=first, second=second):
                    stdout = io.StringIO()
                    stderr = io.StringIO()
                    with patch("random.randint", side_effect=[first, second]) as roll:
                        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                            runpy.run_path(str(SCRIPT), run_name="__main__")
                    self.assertEqual(roll.call_args_list, [call(1, 6), call(1, 6)])
                    self.assertEqual(stdout.getvalue(), f"{first + second}\n")
                    self.assertEqual(stderr.getvalue(), "")

    def test_cli(self):
        for attempt in range(20):
            with self.subTest(attempt=attempt):
                result = subprocess.run(
                    [sys.executable, str(SCRIPT)],
                    capture_output=True,
                    timeout=5,
                )
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stderr, b"")
                self.assertRegex(result.stdout, rb"\A(?:[2-9]|1[0-2])\n\Z")


if __name__ == "__main__":
    unittest.main()
