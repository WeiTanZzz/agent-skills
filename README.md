# agent-skills

A shared repository of AI skills for Claude Code and other AI agents.

## Structure

```
<skill-name>/
  SKILL.md          # Skill definition with frontmatter
  references/       # Optional reference docs the skill reads
  scripts/          # Optional scripts (shell, bun, etc.)
schema.json         # SKILL.md frontmatter specification
SKILLS.md           # Catalog with usage notes
Makefile            # install / list / validate
```

## Skill Types

- `prompt` — pure prompt-based skills
- `script` — script-driven automation
- `hybrid` — prompt + scripts combined

## Install a Skill

```bash
make list                        # available skills
make install SKILL=<skill-name>  # copy into ~/.claude/skills (re-run after pulling to update)
make validate                    # required frontmatter fields present
```

Scripts can also be run straight from a checkout by path, e.g. `bun deck-html/scripts/validate.js deck.html`.

## Skills Catalog

Browse all available skills with usage notes and design insights: [SKILLS.md](./SKILLS.md)

## Contributing

1. Fork this repo
2. Add your skill as a top-level `<skill-name>/` directory
3. Follow the frontmatter schema in `schema.json`
4. Open a PR
