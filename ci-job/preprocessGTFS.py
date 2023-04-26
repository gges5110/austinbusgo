import csv

with open('./capmetro/stop_times.txt', 'r', newline='') as csvfile:
    stop_times = csv.DictReader(csvfile, delimiter=',')

    with open('./capmetro/stop_times1.txt', 'w') as f:
        writer = csv.DictWriter(f, stop_times.fieldnames)
        writer.writeheader()
        for stop_time in stop_times:
            if len(stop_time['arrival_time']) == 7:
                stop_time['arrival_time'] = "0" + stop_time['arrival_time']
            if len(stop_time['departure_time']) == 7:
                stop_time['departure_time'] = "0" + stop_time['departure_time']
            writer.writerow(stop_time)
