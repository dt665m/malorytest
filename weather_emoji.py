"""Convert one supported weather word to an emoji."""

import argparse


WEATHER_EMOJIS = {
    "sunny": "☀️",
    "rainy": "🌧️",
    "cloudy": "☁️",
    "snowy": "🌨️",
    "stormy": "⛈️",
    "windy": "🌬️",
}


def main():
    parser = argparse.ArgumentParser(
        description="Turn a weather word into an emoji (case-insensitive)."
    )
    parser.add_argument(
        "weather",
        type=str.lower,
        choices=WEATHER_EMOJIS,
        help="supported weather word",
    )
    args = parser.parse_args()
    print(WEATHER_EMOJIS[args.weather])


if __name__ == "__main__":
    main()
