PYTHON ?= python3

.PHONY: test
test:
	@status=0; \
	for dir in . tests; do \
		[ -d "$$dir" ] || continue; \
		(cd "$$dir" && \
			set --; \
			for file in test_*.py; do \
				[ ! -f "$$file" ] || set -- "$$@" "$$file"; \
			done; \
			if [ "$$#" -gt 0 ]; then \
				PYTHONPATH="$(CURDIR)$${PYTHONPATH:+:$$PYTHONPATH}" \
					$(PYTHON) -m unittest -v "$$@"; \
			else \
				printf 'No test_*.py files in %s\n' "$$dir"; \
			fi \
		) || status=1; \
	done; \
	exit "$$status"
