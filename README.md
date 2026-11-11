# malorytest
Malory demo test repository

Run the hello script with Python 3:

```sh
python3 hello.py
```

To greet a different name, use `--name` (quote names containing spaces):

```sh
python3 hello.py --name "Ada Lovelace"
```

To print the greeting in uppercase, add `--shout` (also works without `--name`):

```sh
python3 hello.py --name "Ada Lovelace" --shout
```

Output: `HELLO FROM ADA LOVELACE`.

Run the tests with `python3 -m unittest discover -s tests -v`.
