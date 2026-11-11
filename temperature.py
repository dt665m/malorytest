import argparse

parser = argparse.ArgumentParser(description="Convert Celsius to Fahrenheit.")
parser.add_argument("celsius", type=float, help="temperature in degrees Celsius")
args = parser.parse_args()
print(args.celsius * 9 / 5 + 32)
