# Third-party skills

These skills are copied byte-for-byte from upstream repositories under the MIT License. An
adopting repository lists the folders it copies in `.prettierignore`, so formatting never
rewrites them. To take an upstream change, copy the skill again from its source and update
its row; fix a bug in their content upstream, so the next copy keeps the fix. The one
omission: `vercel-react-best-practices` leaves out upstream's `README.md`, which documents
that repository's build tooling.

| Skill                                                              | Source                                                                                                 | Copied at                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `skills/codebase-design/`                                          | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/engineering/codebase-design/`        | `b2888e4f` (skills CLI content hash) |
| `skills/diagnosing-bugs/`                                          | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/engineering/diagnosing-bugs/`        | `b35c6a6e` (skills CLI content hash) |
| `skills/grilling/`                                                 | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/productivity/grilling/`              | `4dd886b0` (skills CLI content hash) |
| `skills/tdd/`                                                      | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/engineering/tdd/`                    | `9ce12c4a` (skills CLI content hash) |
| `skills/writing-for-agents/`                                       | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/productivity/writing-for-agents/`    | `95da47fc` (skills CLI content hash) |
| `adapters/react-storybook/skills/vercel-react-best-practices/`     | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) `skills/react-best-practices/` | `ca7b0c0c` (skills CLI content hash) |

The kit's own skills (`skills/adopt/`, `skills/contract-review/`, `skills/review-triage/`)
are not third-party and carry the kit's licence.

## mattpocock/skills

```text
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## vercel-labs/agent-skills

The skill declares `license: MIT` and `author: vercel` in its `SKILL.md` frontmatter. The
upstream repository has no license file of its own.

The kit's own files are licensed separately under CC BY-SA 4.0; see `LICENSE` and
`README.md` § Licence.
