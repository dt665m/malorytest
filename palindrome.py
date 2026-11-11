#!/usr/bin/env python3
"""Check whether one argument is an exact palindrome."""

import argparse


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Check for a palindrome using exact, case-sensitive Unicode "
            "code-point comparison. Whitespace and punctuation are significant; "
            "no normalization is performed. Empty text is a palindrome. "
            "Use -- before dash-prefixed text."
        )
    )
    parser.add_argument("text", help="text to compare with its reverse")
    args = parser.parse_args()
    print("Palindrome" if args.text == args.text[::-1] else "Not a palindrome")


if __name__ == "__main__":
    main()
