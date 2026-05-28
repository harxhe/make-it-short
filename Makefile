.PHONY: backend-run backend-test backend-build frontend-install frontend-dev frontend-build infra-up infra-down

backend-run:
	cd backend && go run ./cmd/api

backend-test:
	cd backend && go test ./...

backend-build:
	cd backend && go build -o ./bin/api ./cmd/api

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

infra-up:
	cd infra && docker compose up -d

infra-down:
	cd infra && docker compose down
