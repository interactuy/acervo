import argparse
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_csv")
    parser.add_argument("output_csv")
    args = parser.parse_args()

    sys.path.insert(0, r"C:\Users\Usuario\Downloads")
    import fetch_acervo_artist_images as fetcher

    fetcher.S.trust_env = False
    fetcher.run(args.input_csv, args.output_csv)


if __name__ == "__main__":
    main()
