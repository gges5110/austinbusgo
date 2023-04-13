from app import create_app

from server.config import environment, port

if __name__ == '__main__':
    # https://stackoverflow.com/questions/17260338/deploying-flask-with-heroku
    # Bind to PORT if defined, otherwise default to 5000.
    debug = environment == 'LOCAL'
    austin_bus_go_app = create_app()
    austin_bus_go_app.run(host='0.0.0.0', port=port, debug=debug)
