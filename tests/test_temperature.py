import subprocess
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "temperature.py"


class TemperatureTests(unittest.TestCase):
    def run_script(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args], capture_output=True, text=True
        )

    def test_conversions(self):
        cases = [
            ("0", "32.0\n"),
            ("100", "212.0\n"),
            ("-40", "-40.0\n"),
            ("37", "98.6\n"),
            ("12.5", "54.5\n"),
            ("-12.5", "9.5\n"),
            ("-0.5", "31.1\n"),
        ]
        for celsius, expected in cases:
            with self.subTest(celsius=celsius):
                result = self.run_script(celsius)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stdout, expected)
                self.assertEqual(result.stderr, "")

    def test_help(self):
        for flag in ("-h", "--help"):
            with self.subTest(flag=flag):
                result = self.run_script(flag)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stderr, "")
                self.assertIn("usage:", result.stdout)
                self.assertIn("celsius", result.stdout)
                self.assertIn("Fahrenheit", result.stdout)

    def test_invalid_arguments(self):
        cases = [
            ([], "required"),
            (["not-a-number"], "invalid float value"),
            (["0", "100"], "unrecognized arguments"),
        ]
        for args, error in cases:
            with self.subTest(args=args):
                result = self.run_script(*args)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, "")
                self.assertIn("usage:", result.stderr)
                self.assertIn(error, result.stderr)
                self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
