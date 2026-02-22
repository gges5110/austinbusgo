import enum
from typing import List

import strawberry


@strawberry.enum
class GeometryType(enum.Enum):
    Point = "Point"
    LineString = "LineString"
    MultiPoint = "MultiPoint"
    MultiLineString = "MultiLineString"
    Polygon = "Polygon"
    MultiPolygon = "MultiPolygon"
    GeometryCollection = "GeometryCollection"


@strawberry.type
class Point:
    """Point GeoJSON geometry."""

    type: GeometryType
    coordinates: List[float]

    @staticmethod
    def from_dict(d: dict) -> "Point":
        return Point(
            type=GeometryType(d["type"]),
            coordinates=list(d["coordinates"]),
        )


@strawberry.type
class LineString:
    """LineString GeoJSON geometry."""

    type: GeometryType
    coordinates: List[List[float]]

    @staticmethod
    def from_dict(d: dict) -> "LineString":
        return LineString(
            type=GeometryType(d["type"]),
            coordinates=[list(c) for c in d["coordinates"]],
        )
