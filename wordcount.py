"""Count whitespace-separated words in command-line arguments."""

import sys


def count_words(arguments):
    """Return the total number of words across the supplied strings."""
    return sum(len(argument.split()) for argument in arguments)


if __name__ == "__main__":
    print(count_words(sys.argv[1:]))
