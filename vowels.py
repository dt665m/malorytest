#!/usr/bin/env python3
"""Count ASCII vowels in one argument."""

import argparse


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Count ASCII vowel characters a, e, i, o, u case-insensitively. "
            "The letter y and non-ASCII characters (including accented letters) "
            "do not count. Empty text has count 0. "
            "Use -- before dash-prefixed text."
        )
    )
    parser.add_argument("text", help="text whose ASCII vowels to count")
    args = parser.parse_args()
    print(sum(char in "aeiouAEIOU" for char in args.text))


if __name__ == "__main__":
    main()
