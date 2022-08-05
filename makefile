start:
	deno run --allow-all ./index.ts

dev:
	deno run --watch --allow-all ./index.ts

lint:
	deno lint

fmt:
	deno fmt