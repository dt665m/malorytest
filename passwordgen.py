import secrets
import string

# 62 ASCII letters and digits; no whitespace or punctuation.
ALPHABET = string.ascii_letters + string.digits

print("".join(secrets.choice(ALPHABET) for _ in range(16)))
