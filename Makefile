INSTALL_DIR := $(HOME)/.claude/skills
# A skill is a top-level directory with a SKILL.md.
SKILLS := $(patsubst %/SKILL.md,%,$(wildcard */SKILL.md))

.PHONY: install list validate

# Copies the skill into INSTALL_DIR, replacing an earlier copy. A symlinked install (pointing at a checkout) is left alone.
install:
	@if [ -z "$(SKILL)" ]; then echo "Usage: make install SKILL=<skill-name>  (one of: $(SKILLS))"; exit 1; fi
	@if [ ! -f "$(SKILL)/SKILL.md" ]; then echo "Skill '$(SKILL)' not found (one of: $(SKILLS))"; exit 1; fi
	@target="$(INSTALL_DIR)/$(SKILL)"; \
	if [ -L "$$target" ]; then \
		echo "$$target is a symlink to a checkout; nothing to copy"; \
	else \
		mkdir -p "$(INSTALL_DIR)" && rm -rf "$$target" && cp -R "$(SKILL)" "$$target" && echo "Installed $(SKILL) to $$target"; \
	fi

list:
	@echo "Available skills:"
	@for skill in $(SKILLS); do echo "  $$skill"; done

validate:
	@echo "Validating skill frontmatter..."
	@status=0; for skill in $(SKILLS); do \
		for field in name version type description; do \
			if ! sed -n '2,/^---$$/p' "$$skill/SKILL.md" | grep -q "^$$field:"; then \
				echo "  MISSING $$field: $$skill"; status=1; \
			fi; \
		done; \
	done; \
	if [ $$status -eq 0 ]; then echo "  OK: $(SKILLS)"; fi; \
	exit $$status
