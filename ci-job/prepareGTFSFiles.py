import csv
import os
import shutil
import subprocess
from datetime import datetime


def preprocess():
    if os.path.isfile('./capmetro/stop_times.txt'):
        os.rename('./capmetro/stop_times.txt', './capmetro/temp_stop_times.txt')

    with open('./capmetro/temp_stop_times.txt', 'r', newline='') as csvfile:
        stop_times = csv.DictReader(csvfile, delimiter=',')

        with open('./capmetro/stop_times.txt', 'w') as f:
            writer = csv.DictWriter(f, stop_times.fieldnames)
            writer.writeheader()
            for stop_time in stop_times:
                if len(stop_time['arrival_time']) == 7:
                    stop_time['arrival_time'] = "0" + stop_time['arrival_time']
                if len(stop_time['departure_time']) == 7:
                    stop_time['departure_time'] = "0" + stop_time['departure_time']
                writer.writerow(stop_time)

    if os.path.isfile('./capmetro/temp_stop_times.txt'):
        os.remove('./capmetro/temp_stop_times.txt')


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
    preprocess()

    print("Finished!")


if __name__ == '__main__':
    prepare()
