"""Run with: python3 -m unittest discover -v."""

from pathlib import Path
import subprocess
import sys
import unittest

from leapyear import is_leap_year


SCRIPT = Path(__file__).resolve().with_name("leapyear.py")
CASES = (
    (2024, True),
    (2023, False),
    (1900, False),
    (2000, True),
    (2100, False),
    (2400, True),
    (1, False),
    (4, True),
    (9999, False),
)


class LeapYearTests(unittest.TestCase):
    def test_gregorian_rule(self):
        for year, expected in CASES:
            with self.subTest(year=year):
                self.assertEqual(is_leap_year(year), expected)


class LeapYearCliTests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_valid_years(self):
        for year, leap in CASES:
            with self.subTest(year=year):
                result = self.run_cli(str(year))
                qualifier = "" if leap else "not "
                self.assertEqual(result.returncode, 0)
                self.assertEqual(
                    result.stdout, f"{year} is {qualifier}a leap year.\n"
                )
                self.assertEqual(result.stderr, "")

    def test_invalid_arguments(self):
        cases = (
            ((), "required"),
            (("abc",), "invalid int value"),
            (("2024.5",), "invalid int value"),
            (("2024", "2023"), "unrecognized arguments"),
            (("0",), "year must be from 1 to 9999"),
            (("-1",), "year must be from 1 to 9999"),
            (("10000",), "year must be from 1 to 9999"),
        )
        for args, message in cases:
            with self.subTest(args=args):
                result = self.run_cli(*args)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, "")
                self.assertIn("usage:", result.stderr)
                self.assertIn("error:", result.stderr)
                self.assertIn(message, result.stderr)
                self.assertNotIn("Traceback", result.stderr)

    def test_help(self):
        for option in ("-h", "--help"):
            with self.subTest(option=option):
                result = self.run_cli(option)
                self.assertEqual(result.returncode, 0)
                self.assertIn("usage:", result.stdout)
                self.assertIn("Gregorian", result.stdout)
                self.assertIn("1 to 9999", result.stdout)
                self.assertEqual(result.stderr, "")


if __name__ == "__main__":
    unittest.main()
