"""Wait for a duration in seconds, then print Done."""

import argparse
import math
import time


def parse_seconds(value):
    """Accept only finite, nonnegative durations."""
    try:
        seconds = float(value)
    except ValueError:
        raise argparse.ArgumentTypeError(
            "seconds must be a nonnegative finite number"
        ) from None
    if not math.isfinite(seconds) or seconds < 0:
        raise argparse.ArgumentTypeError(
            "seconds must be a nonnegative finite number"
        )
    return seconds


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "seconds",
        type=parse_seconds,
        help="duration in seconds (nonnegative and finite; fractions allowed)",
    )
    args = parser.parse_args(argv)
    try:
        time.sleep(args.seconds)
    except (OverflowError, OSError, ValueError) as error:
        parser.error(f"cannot wait for that duration: {error}")
    print("Done")


if __name__ == "__main__":
    main()
