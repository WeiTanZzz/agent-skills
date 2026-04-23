# agent-skills

A shared repository of AI skills for Claude Code and other AI agents.

## Structure

```
skills/
  <skill-name>/
    SKILL.md        # Skill definition with frontmatter
    README.md       # Usage and examples
    scripts/        # Optional scripts (shell, python, etc.)
tools/              # Reusable utility scripts
schema.json         # SKILL.md frontmatter specification
Makefile            # install / list / validate
```

## Skill Types

- `prompt` — pure prompt-based skills
- `script` — script-driven automation
- `hybrid` — prompt + scripts combined

## Install a Skill

```bash
make install SKILL=<skill-name>
```

## Skills Catalog

Browse all available skills with usage notes and design insights: [SKILLS.md](./SKILLS.md)

## Contributing

1. Fork this repo
2. Add your skill under `skills/<skill-name>/`
3. Follow the frontmatter schema in `schema.json`
4. Open a PR
