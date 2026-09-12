# Execution Scripts

This folder contains all deterministic Python scripts for the EWUMart project.

Scripts here are:
- **Reliable**: No LLM guesswork — pure logic
- **Testable**: Can be run in isolation
- **Well-commented**: Each script explains what it does and why

## Index

| Script | Purpose | Directive |
|--------|---------|-----------|
| *(add scripts here as you create them)* | | |

## Conventions

- Load secrets from `.env` via `python-dotenv`
- Accept inputs via CLI args or config dicts at the top of the file
- Print clear success/error messages
- Exit with code 0 on success, 1 on failure

## Setup

```bash
pip install python-dotenv
```

Add any additional dependencies here as they are introduced.
