all:
	docker compose up --build -d

build:
	docker compose build
	
down:
	docker compose down

clean:
	docker compose down -v

dev:
	docker compose -f docker-compose.dev.yml --env-file .env.dev up --build

down-dev:
	docker compose -f docker-compose.dev.yml down

clean-dev:
	docker compose -f docker-compose.dev.yml down -v

infra:
	docker compose -f docker-compose.jenkins-infra.yml up --build -d

down-infra:
	docker compose -f docker-compose.jenkins-infra.yml down

prune:
	docker system prune -af --volumes

.PHONY: all dev down down-dev fclean infra down-infra prune



