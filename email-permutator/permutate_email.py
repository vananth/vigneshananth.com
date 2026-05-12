#!/usr/bin/env python3
"""Generate ranked email permutations for outreach."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from typing import List


PATTERNS = [
    "{first}.{last}@{domain}",
    "{first}{last}@{domain}",
    "{f}.{last}@{domain}",
    "{first}.{l}@{domain}",
    "{first}@{domain}",
    "{last}.{first}@{domain}",
    "{f}{last}@{domain}",
    "{first}_{last}@{domain}",
]


def normalize_name(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z]", "", name)
    return cleaned.lower()


def normalize_domain(domain: str) -> str:
    return domain.strip().lower().lstrip("@")


def generate_emails(first_name: str, last_name: str, domain: str) -> List[str]:
    first = normalize_name(first_name)
    last = normalize_name(last_name)
    domain = normalize_domain(domain)

    if not first or not last or not domain:
        raise ValueError("First name, last name, and domain must be non-empty after normalization.")

    tokens = {
        "first": first,
        "last": last,
        "f": first[0],
        "l": last[0],
        "domain": domain,
    }

    ranked: List[str] = []
    seen = set()
    for pattern in PATTERNS:
        candidate = pattern.format(**tokens)
        if candidate not in seen:
            ranked.append(candidate)
            seen.add(candidate)
    return ranked


def build_copy_block(emails: List[str]) -> str:
    if not emails:
        return "To: \nBcc: "

    primary = emails[0]
    bcc = ", ".join(emails[1:])
    return f"To: {primary}\nBcc: {bcc}"


def maybe_copy_to_clipboard(text: str) -> str:
    pbcopy = shutil.which("pbcopy")
    if not pbcopy:
        return "Clipboard not updated: 'pbcopy' not found on this system."

    try:
        subprocess.run([pbcopy], input=text, text=True, check=True)
        return "Copied To/Bcc block to clipboard via pbcopy."
    except subprocess.SubprocessError as exc:
        return f"Clipboard copy failed: {exc}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate ranked work-email permutations and a copy-ready To/Bcc block."
    )
    parser.add_argument("first_name", help="Recipient first name")
    parser.add_argument("last_name", help="Recipient last name")
    parser.add_argument("domain", help="Company domain, e.g. example.com")
    parser.add_argument(
        "--top",
        type=int,
        default=8,
        help="Number of ranked candidates to keep (default: 8)",
    )
    parser.add_argument(
        "--no-copy",
        action="store_true",
        help="Do not copy To/Bcc block to clipboard",
    )
    parser.add_argument(
        "--format",
        choices=["text", "csv"],
        default="text",
        help="Output format for ranked list (default: text)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.top <= 0:
        print("--top must be greater than 0", file=sys.stderr)
        return 2

    try:
        emails = generate_emails(args.first_name, args.last_name, args.domain)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    shortlist = emails[: args.top]

    if args.format == "text":
        print("Ranked email candidates:")
        for idx, email in enumerate(shortlist, start=1):
            print(f"{idx}. {email}")
    else:
        print("rank,email")
        for idx, email in enumerate(shortlist, start=1):
            print(f"{idx},{email}")

    copy_block = build_copy_block(shortlist)
    print("\nCopy block:")
    print(copy_block)

    if not args.no_copy:
        print(f"\n{maybe_copy_to_clipboard(copy_block)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
