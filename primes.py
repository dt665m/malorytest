number = 2
printed = 0
while printed < 20:
    if all(number % divisor != 0 for divisor in range(2, number)):
        print(number)
        printed += 1
    number += 1
