"""Report leap years in the proleptic Gregorian calendar for years 1–9999."""

import argparse


def is_leap_year(year: int) -> bool:
    """Return whether a year is divisible by 4, except non-400 centuries."""
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Check whether a year is a leap year in the proleptic Gregorian "
            "calendar (the Gregorian rule applied to all supported years)."
        )
    )
    parser.add_argument("year", type=int, help="year from 1 to 9999 (inclusive)")
    args = parser.parse_args()
    if not 1 <= args.year <= 9999:
        parser.error("year must be from 1 to 9999 (inclusive)")

    qualifier = "" if is_leap_year(args.year) else "not "
    print(f"{args.year} is {qualifier}a leap year.")


if __name__ == "__main__":
    main()
