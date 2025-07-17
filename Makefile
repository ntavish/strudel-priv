.PHONY: build down up re report
.DEFAULT_GOAL:= re

build:
	docker build --rm -t strudel:local .

down:
	-docker-compose down

up: down
	docker-compose up -d

re: down build up

report:
	docker scout recommendations > vuln-report.txt
	docker scout cves strudel:local >> vuln-report.txt
