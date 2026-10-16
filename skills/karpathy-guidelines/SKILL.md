---
name: karpathy-guidelines
description: Use when writing or reviewing code to surface consequential assumptions, avoid speculative complexity, keep changes surgical, and define verifiable success criteria.
license: MIT
---

# Karpathy Guidelines

Use these behavioral checks for coding and review, based on [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876). They favor caution over speed; scale them to the task.

- **Think first:** Name consequential assumptions and tradeoffs. Ask when an unresolved choice materially changes the result.
- **Solve the current problem:** Prefer the smallest clear solution; avoid speculative features, abstractions, dependencies, and configuration.
- **Edit surgically:** Preserve unrelated code and conventions. Remove only orphans created by your own changes.
- **Verify the outcome:** State observable success criteria, add focused tests when useful, run relevant checks, and distinguish verified behavior from remaining uncertainty.

This skill is self-contained and does not grant permission for unrelated changes.
