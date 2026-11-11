import contextlib
import io
from pathlib import Path
import runpy
import subprocess
import sys
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("coinflip.py")


class CoinflipTests(unittest.TestCase):
    def test_each_outcome_uses_one_fair_draw_and_exact_output(self):
        for outcome in ("heads", "tails"):
            with self.subTest(outcome=outcome):
                stdout = io.StringIO()
                stderr = io.StringIO()
                with (
                    patch("random.choice", return_value=outcome) as choice,
                    contextlib.redirect_stdout(stdout),
                    contextlib.redirect_stderr(stderr),
                ):
                    runpy.run_path(str(SCRIPT), run_name="__main__")

                choice.assert_called_once()
                self.assertCountEqual(choice.call_args.args[0], ("heads", "tails"))
                self.assertEqual(stdout.getvalue(), outcome + "\n")
                self.assertEqual(stderr.getvalue(), "")

    def test_real_cli_output(self):
        for invocation in range(10):
            with self.subTest(invocation=invocation):
                result = subprocess.run(
                    [sys.executable, str(SCRIPT)],
                    capture_output=True,
                    timeout=5,
                )
                self.assertEqual(result.returncode, 0)
                self.assertIn(result.stdout, (b"heads\n", b"tails\n"))
                self.assertEqual(result.stderr, b"")


if __name__ == "__main__":
    unittest.main()
