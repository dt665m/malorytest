import argparse
from pathlib import Path

parser = argparse.ArgumentParser(description="Count whitespace-delimited words in a UTF-8 text file.")
parser.add_argument("path", type=Path, help="path to a UTF-8 text file")
args = parser.parse_args()
try:
    text = args.path.read_text(encoding="utf-8")
except (OSError, UnicodeError) as error:
    parser.error(f"cannot read {args.path}: {error}")
print(len(text.split()))
