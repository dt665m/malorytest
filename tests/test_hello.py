import subprocess
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "hello.py"


class HelloTests(unittest.TestCase):
    def run_script(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args], capture_output=True, text=True
        )

    def test_greetings(self):
        cases = [
            ([], "Hello from Malory\n"),
            (["--name", "Ada"], "Hello from Ada\n"),
            (["--name", "aDa LoveLace"], "Hello from aDa LoveLace\n"),
            (["--shout"], "HELLO FROM MALORY\n"),
            (["--name", "aDa LoveLace", "--shout"], "HELLO FROM ADA LOVELACE\n"),
            (["--shout", "--name", "aDa LoveLace"], "HELLO FROM ADA LOVELACE\n"),
        ]
        for args, expected in cases:
            with self.subTest(args=args):
                result = self.run_script(*args)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stdout, expected)
                self.assertEqual(result.stderr, "")

    def test_help(self):
        for flag in ("--help", "-h"):
            with self.subTest(flag=flag):
                result = self.run_script(flag)
                self.assertEqual(result.returncode, 0)
                self.assertEqual(result.stderr, "")
                for text in ("usage:", "--name", "--shout", "Malory"):
                    self.assertIn(text, result.stdout)

    def test_invalid_arguments(self):
        cases = [
            (["--name"], "expected one argument"),
            (["--unknown"], "unrecognized arguments"),
            (["--shout=yes"], "ignored explicit argument"),
        ]
        for args, error in cases:
            with self.subTest(args=args):
                result = self.run_script(*args)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, "")
                self.assertIn("usage:", result.stderr)
                self.assertIn(error, result.stderr)


if __name__ == "__main__":
    unittest.main()
