export PYTHONPATH := ./server

install:
	pip install -r requirements.txt

run: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
run:
	flask --app 'server/app:create_app()' --debug run

test:
	python -m unittest discover -s tests

coverage:
	coverage run --source=./server -m unittest discover -s tests
	coverage report -m

run-prod:
	gunicorn 'server.app:create_app()'

lint:
	autopep8 --in-place -v --recursive server/. tests/.

downloadGTFS:
	./ci-job/downloadGTFS.sh

setup-local:
	docker-compose up
