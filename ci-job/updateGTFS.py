import csv
import datetime
import os
import subprocess

subprocess.call("./ci-job/downloadGTFS.sh")

# Checking feed_start_date from capmetro.feed_info.txt
feed_start_date = None
with open('./capmetro/feed_info.txt', newline='') as csvfile:
    feed_info = csv.DictReader(csvfile, delimiter=',')
    for row in feed_info:
        feed_start_date = datetime.datetime.strptime(row['feed_start_date'], "%Y%m%d").date()

if feed_start_date is not None:
    print('feed_start_date: ' + feed_start_date.isoformat())

subprocess.call("./ci-job/uploadGTFS.sh", env=os.environ)
