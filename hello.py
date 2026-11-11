import argparse

parser = argparse.ArgumentParser(description="Print a friendly greeting.")
parser.add_argument("--name", default="Malory", help="name to greet (default: Malory)")
args = parser.parse_args()
print(f"Hello from {args.name}")
