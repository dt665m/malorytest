import argparse


def main():
    parser = argparse.ArgumentParser(description="Print a string reversed.")
    parser.add_argument("text", help="the string to reverse")
    args = parser.parse_args()
    print(args.text[::-1])


if __name__ == "__main__":
    main()
