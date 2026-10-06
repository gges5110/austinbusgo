"""Geometry helpers shared by services and the API layer."""

import json
from typing import Optional


def geom_to_dict(geom) -> Optional[dict]:
    """Convert various geometry representations to a GeoJSON dict.

    Handles: dict (legacy) and str (GeoJSON text as stored in the database).
    """
    if geom is None:
        return None
    if isinstance(geom, dict):
        return geom
    return json.loads(geom)
