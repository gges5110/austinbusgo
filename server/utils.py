from datetime import datetime, timedelta


def gtfs_time_to_datetime(gtfs_date, gtfs_time):
    hours, minutes, seconds = tuple(
        int(token) for token in gtfs_time.split(":")
    )
    return (
        datetime.strptime(gtfs_date, "%Y%m%d") + timedelta(
            hours=hours, minutes=minutes, seconds=seconds
        )
    )


def parse_time(time: str):
    try:
        parsed_time = datetime.strptime(time, '%H:%M:%S')
    except ValueError:
        time = time.replace('1 day, 1', '01', 1)
        parsed_time = datetime.strptime(time, '%H:%M:%S')
    return parsed_time
