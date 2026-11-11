# Contributing

## Requirements

- Python 3 to run the script; no third-party packages are needed.
- Git and a GitHub account to propose a change.

## Run the script

Run this command from the repository root (the folder containing this guide):

```sh
python3 hello.py
```

Expected output:

```text
Hello from Malory
```

**Note:** `main` does not yet contain `hello.py`. Run this example only after
the hello-script change lands, or on a branch containing it.

## Propose a change

1. Open a GitHub issue describing the problem or idea and the expected behavior.
   For an existing issue, discuss your plan there instead.
2. Fork the repository if you do not have write access, then clone your fork.
   Otherwise, clone this repository. Start from the latest `main` and create a
   new branch, for example `git switch -c improve-greeting`.
3. Make a small, focused change and update any affected documentation.
4. From the repository root, run the script example above when the script is
   available. Check its output, test any behavior you changed, and run
   `git diff --check`. If the script is absent, say so in your validation notes.
5. Commit your changes and push your branch to your fork (or this repository
   if you have write access). Open a pull request targeting `main`, link the
   issue, and summarize the change and validation results. Respond to review
   feedback before the pull request is merged.
