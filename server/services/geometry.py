"""Geometry helpers shared by services and the API layer."""

import json
from typing import Optional


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
