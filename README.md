# malorytest
Malory demo test repository

## Timer

Run `python3 timer.py SECONDS` to wait, then print `Done`. Seconds must be a
nonnegative finite number; zero and fractional values (such as `0.25`) are allowed.
Use `python3 timer.py --help` for usage. Invalid input or an unsupported wait
returns an error on stderr with a nonzero exit status.

Run the tests with `python3 -m unittest -v`.
