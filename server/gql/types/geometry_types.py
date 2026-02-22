import enum
import json
from typing import List, Optional

import strawberry


def geom_to_dict(geom) -> Optional[dict]:
    """Convert various geometry representations to a GeoJSON dict.

    Handles: dict (legacy), str (ST_AsGeoJSON output), GeoAlchemy2 WKBElement.
    """
    if geom is None:
        return None
    if isinstance(geom, dict):
        return geom
    if isinstance(geom, str):
        return json.loads(geom)
    # GeoAlchemy2 WKBElement or similar
    try:
        from geoalchemy2.shape import to_shape
        from shapely import to_geojson

        return json.loads(to_geojson(to_shape(geom)))
    except Exception:
        return None


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
