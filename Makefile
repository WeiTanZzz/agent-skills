SKILLS_DIR := skills
INSTALL_DIR := ~/.claude/skills

.PHONY: install list validate

install:
	@if [ -z "$(SKILL)" ]; then echo "Usage: make install SKILL=<skill-name>"; exit 1; fi
	@if [ ! -d "$(SKILLS_DIR)/$(SKILL)" ]; then echo "Skill '$(SKILL)' not found"; exit 1; fi
	mkdir -p $(INSTALL_DIR)
	cp -r $(SKILLS_DIR)/$(SKILL) $(INSTALL_DIR)/$(SKILL)
	@echo "Installed $(SKILL) to $(INSTALL_DIR)/$(SKILL)"

list:
	@echo "Available skills:"
	@ls $(SKILLS_DIR)/

validate:
	@echo "Validating skill frontmatter..."
	@for dir in $(SKILLS_DIR)/*/; do \
		skill=$$(basename $$dir); \
		if [ ! -f "$$dir/SKILL.md" ]; then \
			echo "  MISSING SKILL.md: $$skill"; \
		else \
			echo "  OK: $$skill"; \
		fi \
	done
