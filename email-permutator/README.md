# Email Permutator

A small dependency-free Python CLI that generates ranked work-email permutations from:
- first name
- last name
- company domain

It also builds a copy-ready block with one `To` address and the rest as `Bcc`, and can auto-copy that block using macOS `pbcopy`.

## Usage

```bash
python3 permutate_email.py <first_name> <last_name> <domain>
```

Example:

```bash
python3 permutate_email.py John Smith example.com
```

## Options

- `--top N` limit number of generated candidates (default: `8`)
- `--no-copy` disable clipboard copy
- `--format text|csv` render ranked list in text or CSV format

Examples:

```bash
python3 permutate_email.py John Smith example.com --top 5
python3 permutate_email.py John Smith example.com --format csv
python3 permutate_email.py John Smith example.com --no-copy
```

## Ranking Order (Conservative)

1. `first.last@domain`
2. `firstlast@domain`
3. `f.last@domain`
4. `first.l@domain`
5. `first@domain`
6. `last.first@domain`
7. `flast@domain`
8. `first_last@domain`

## Notes

- Inputs are normalized to lowercase.
- Non-letter characters are stripped from names.
- This tool does not verify mailbox deliverability.
