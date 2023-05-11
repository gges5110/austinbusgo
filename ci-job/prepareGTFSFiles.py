import csv
import os
import shutil
import subprocess
from datetime import datetime
import copy


def preprocess_stop_times():
    filename = './capmetro/stop_times.txt'
    temp_filename = './capmetro/temp_stop_times.txt'

    if os.path.isfile(filename):
        os.rename(filename, temp_filename)

    with open(temp_filename, 'r', newline='') as csvfile:
        stop_times = csv.DictReader(csvfile, delimiter=',')

        with open(filename, 'w') as f:
            writer = csv.DictWriter(f, stop_times.fieldnames)
            writer.writeheader()
            for stop_time in stop_times:
                if len(stop_time['arrival_time']) == 7:
                    stop_time['arrival_time'] = "0" + stop_time['arrival_time']
                if len(stop_time['departure_time']) == 7:
                    stop_time['departure_time'] = "0" + stop_time['departure_time']
                writer.writerow(stop_time)

    if os.path.isfile(temp_filename):
        os.remove(temp_filename)


def preprocess_stops():
    filename = './capmetro/stops.txt'
    temp_filename = './capmetro/temp_stops.txt'
    if os.path.isfile(filename):
        os.rename(filename, temp_filename)

    with open(temp_filename, 'r', newline='') as csvfile:
        stops = csv.DictReader(csvfile, delimiter=',')
        header = copy.copy(stops.fieldnames) or []
        header[header.index("stop_lat")] = "stop_loc"
        header.remove("stop_lon")

        with open(filename, 'w') as f:
            writer = csv.DictWriter(f, header)
            writer.writeheader()
            for stop in stops:
                stop['stop_loc'] = "POINT({} {})".format(
                    stop['stop_lon'], stop['stop_lat']
                )
                del stop['stop_lon']
                del stop['stop_lat']
                writer.writerow(stop)

    if os.path.isfile(temp_filename):
        os.remove(temp_filename)


def preprocess_shapes():
    filename = './capmetro/shapes.txt'
    temp_filename = './capmetro/temp_shapes.txt'
    if os.path.isfile(filename):
        os.rename(filename, temp_filename)

    with open(temp_filename, 'r', newline='') as csvfile:
        shapes = csv.DictReader(csvfile, delimiter=',')
        header = copy.copy(shapes.fieldnames) or []
        header[header.index("shape_pt_lat")] = "shape_pt_loc"
        header.remove("shape_pt_lon")

        with open(filename, 'w') as f:
            writer = csv.DictWriter(f, header)
            writer.writeheader()
            for shape in shapes:
                shape['shape_pt_loc'] = "POINT({} {})".format(
                    shape['shape_pt_lon'], shape['shape_pt_lat']
                )
                del shape['shape_pt_lon']
                del shape['shape_pt_lat']
                writer.writerow(shape)

    if os.path.isfile(temp_filename):
        os.remove(temp_filename)


def check_feed_dates():
    feed_start_date = None
    feed_end_date = None
    with open('./capmetro/feed_info.txt', newline='') as csvfile:
        feed_info = csv.DictReader(csvfile, delimiter=',')
        for row in feed_info:
            feed_start_date = datetime.strptime(row['feed_start_date'], "%Y%m%d").date()
            feed_end_date = datetime.strptime(row['feed_end_date'], "%Y%m%d").date()

    if feed_start_date is not None:
        print('feed_start_date: ' + feed_start_date.isoformat())
    if feed_end_date is not None:
        print('feed_end_date: ' + feed_end_date.isoformat())


def prepare():
    if shutil.which("curl") is None:
        subprocess.call("./getCurl.sh")

    subprocess.call("./downloadGTFS.sh")

    check_feed_dates()

    print("Start preprocessing GTFS files...")
    preprocess_stop_times()
    preprocess_stops()
    preprocess_shapes()

    print("Finished!")


if __name__ == '__main__':
    prepare()
