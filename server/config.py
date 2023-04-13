import os

port = int(os.environ.get('PORT', 5000))
environment = os.environ.get('ENVIRONMENT', 'LOCAL')

capital_metro_trip_updates_pb_file_url = 'https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream'
capital_metro_vehicle_positions_pb_file_url = 'https://data.texas.gov/download/eiei-9rpf/application%2Foctet-stream'
