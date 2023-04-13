export PYTHONPATH := ./server

install:
	pip install -r requirements.txt --user

run:
	python server/run.py

test:
	python -m unittest discover -s tests

coverage:
	coverage run --source=./server -m unittest discover -s tests
	coverage report -m

run-ci:
	gunicorn 'server.app:create_app()'

lint:
	autopep8 --in-place -v --recursive server/. tests/.

downloadGTFS:
	./ci-job/downloadGTFS.sh