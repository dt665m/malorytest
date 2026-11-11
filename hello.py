import argparse

parser = argparse.ArgumentParser(description="Print a friendly greeting.")
parser.add_argument("--name", default="Malory", help="name to greet (default: Malory)")
parser.add_argument("--shout", action="store_true", help="print the greeting in uppercase")
args = parser.parse_args()
greeting = f"Hello from {args.name}"
print(greeting.upper() if args.shout else greeting)
