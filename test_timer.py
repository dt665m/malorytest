"""Tests for the standalone timer CLI; run with python3 -m unittest -v."""

import contextlib
import io
from pathlib import Path
import subprocess
import sys
import time
import unittest
from unittest.mock import patch

import timer


SCRIPT = Path(__file__).with_name("timer.py")


class TimerTests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            capture_output=True,
            text=True,
            timeout=10,
        )

    def test_exact_duration_and_output_only_after_sleep(self):
        for argument, expected in [("0", 0.0), ("0.125", 0.125), ("12", 12.0),
                                   ("1e2", 100.0)]:
            with self.subTest(argument=argument):
                stdout, stderr = io.StringIO(), io.StringIO()
                completed = []

                def sleep(seconds):
                    self.assertEqual(seconds, expected)
                    self.assertEqual(stdout.getvalue(), "")
                    self.assertEqual(stderr.getvalue(), "")
                    completed.append(True)

                with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                    with patch("timer.time.sleep", side_effect=sleep) as mock_sleep:
                        timer.main([argument])
                mock_sleep.assert_called_once_with(expected)
                self.assertEqual(completed, [True])
                self.assertEqual(stdout.getvalue(), "Done\n")
                self.assertEqual(stderr.getvalue(), "")

    def test_invalid_arguments_do_not_sleep_or_print(self):
        cases = [
            [], ["1", "2"], ["-1"], ["-0.25"], ["hello"],
            ["nan"], ["NaN"], ["inf"], ["infinity"], ["-inf"],
            ["1e309"], ["--unknown"],
        ]
        for args in cases:
            with self.subTest(args=args):
                stdout, stderr = io.StringIO(), io.StringIO()
                with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                    with patch("timer.time.sleep") as sleep:
                        with self.assertRaises(SystemExit) as exit_context:
                            timer.main(args)
                self.assertEqual(exit_context.exception.code, 2)
                sleep.assert_not_called()
                self.assertEqual(stdout.getvalue(), "")
                self.assertIn("error:", stderr.getvalue())
                self.assertNotIn("Traceback", stderr.getvalue())
                if len(args) == 1 and args[0] not in ("-inf", "--unknown"):
                    self.assertIn("nonnegative finite number", stderr.getvalue())

    def test_platform_sleep_errors_are_clean(self):
        for error in [OverflowError("too large"), OSError("OS limit"),
                      ValueError("out of range")]:
            with self.subTest(error=error):
                stdout, stderr = io.StringIO(), io.StringIO()
                with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                    with patch("timer.time.sleep", side_effect=error) as sleep:
                        with self.assertRaises(SystemExit) as exit_context:
                            timer.main(["1e100"])
                sleep.assert_called_once_with(1e100)
                self.assertEqual(exit_context.exception.code, 2)
                self.assertEqual(stdout.getvalue(), "")
                self.assertIn("cannot wait for that duration", stderr.getvalue())
                self.assertNotIn("Traceback", stderr.getvalue())

    def test_cli_zero(self):
        result = self.run_cli("0")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "Done\n")
        self.assertEqual(result.stderr, "")

    def test_cli_help(self):
        for flag in ["-h", "--help"]:
            with self.subTest(flag=flag):
                result = self.run_cli(flag)
                self.assertEqual(result.returncode, 0)
                self.assertIn("seconds", result.stdout)
                self.assertIn("fractions allowed", result.stdout)
                self.assertNotIn("Done\n", result.stdout)
                self.assertEqual(result.stderr, "")

    def test_cli_errors(self):
        for args in [[], ["0", "1"], ["-1"], ["nope"], ["nan"], ["inf"], ["1e100"]]:
            with self.subTest(args=args):
                result = self.run_cli(*args)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, "")
                self.assertIn("error:", result.stderr)
                self.assertNotIn("Traceback", result.stderr)

    def test_real_fractional_sleep(self):
        seconds = 0.05
        start = time.monotonic()
        result = self.run_cli(str(seconds))
        elapsed = time.monotonic() - start
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "Done\n")
        self.assertEqual(result.stderr, "")
        self.assertGreaterEqual(elapsed, seconds)
        self.assertLess(elapsed, 10.0)


if __name__ == "__main__":
    unittest.main()
