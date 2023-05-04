import csv
import os

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
