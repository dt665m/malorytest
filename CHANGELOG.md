# Changelog

## Snapshot — 2026-11-11, 12:18:55 UTC

Default branch: `main` at [`3f66b18bcd6f6fb063d8dddfbe3cc183aa10126a`](https://github.com/dt665m/malorytest/tree/3f66b18bcd6f6fb063d8dddfbe3cc183aa10126a).
This records repository history, script sources, and all open/closed PRs checked at the snapshot time, not a release. Statuses may change afterward; script links below pin the inspected source commits.

### Landed on the default branch

No scripts have landed. The only commit is the initial commit, and its tree contains only `README.md`.

### Pending script additions — not merged or released

| Script (verified source) | Behavior | Tracking at snapshot |
| --- | --- | --- |
| [`hello.py`](https://github.com/dt665m/malorytest/blob/e354250aee2252fc186cc163aaf1ed8fe242a87e/hello.py) | Prints `Hello from Malory`. | [Issue #1](https://github.com/dt665m/malorytest/issues/1); open [PR #2](https://github.com/dt665m/malorytest/pull/2). |
| [`fizzbuzz.py`](https://github.com/dt665m/malorytest/blob/4a8850121aea73f2983cbbdf8640e32b40f48f36/fizzbuzz.py) | Prints FizzBuzz for numbers 1–100. | [Issue #9](https://github.com/dt665m/malorytest/issues/9); open [PR #12](https://github.com/dt665m/malorytest/pull/12). |
| [`primes.py`](https://github.com/dt665m/malorytest/blob/02fabd9d88f4c9cd1d31587a73679c4425600492/primes.py) | Prints the first 20 prime numbers. | [Issue #15](https://github.com/dt665m/malorytest/issues/15); open [PR #18](https://github.com/dt665m/malorytest/pull/18). |
| [`countdown.py`](https://github.com/dt665m/malorytest/blob/63ba8e92b918630440bdf7eee2deb1d2266ca08c/countdown.py) | Counts down from 10 to 1, then prints `Liftoff`. | [Issue #17](https://github.com/dt665m/malorytest/issues/17); open [PR #20](https://github.com/dt665m/malorytest/pull/20). |
| [`dice.py`](https://github.com/dt665m/malorytest/blob/c033d5343768af1b286d3f108433903fc0583bdd/dice.py) | Rolls two six-sided dice and prints their total. | [Issue #21](https://github.com/dt665m/malorytest/issues/21); open [PR #24](https://github.com/dt665m/malorytest/pull/24). |
| [`temperature.py`](https://github.com/dt665m/malorytest/blob/b177783ea1b9aa4bdaa21139ac7cdb97a3cb5165/temperature.py) | Converts a Celsius command-line argument to Fahrenheit. | [Issue #23](https://github.com/dt665m/malorytest/issues/23); open [PR #26](https://github.com/dt665m/malorytest/pull/26). |
| [`wordcount.py`](https://github.com/dt665m/malorytest/blob/19da4c1b142be2e31883009d610afcd19e21a1ee/wordcount.py) | Counts whitespace-delimited words in a UTF-8 text file supplied as an argument. | [Issue #27](https://github.com/dt665m/malorytest/issues/27); open [PR #31](https://github.com/dt665m/malorytest/pull/31). |
| [`passwordgen.py`](https://github.com/dt665m/malorytest/blob/520ebeb4758470cdef035282e155f1117311c47c/passwordgen.py) | Prints a random 16-character alphanumeric password using `secrets.choice`. | [Issue #28](https://github.com/dt665m/malorytest/issues/28); open [PR #30](https://github.com/dt665m/malorytest/pull/30). |

### Pending extensions — not additional scripts

- `hello.py` gains `--name` to customize the greeting: [issue #3](https://github.com/dt665m/malorytest/issues/3), open [PR #4](https://github.com/dt665m/malorytest/pull/4), [verified source](https://github.com/dt665m/malorytest/blob/15c8d8c9fdb17c1451e7f202942dd11bf0aa046c/hello.py).
- `hello.py` gains `--shout` for uppercase output while retaining `--name`: [issue #11](https://github.com/dt665m/malorytest/issues/11), open [PR #14](https://github.com/dt665m/malorytest/pull/14), [verified source](https://github.com/dt665m/malorytest/blob/4ee44127d9efdcfcb2d351eeecc67717d0f0bad0/hello.py).

Test modules, workflows, configuration, documentation, and the license are not counted as user scripts.
