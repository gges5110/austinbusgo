# Stop Selection and Ranking Logic

This document explains how Austin Bus Go determines which stops to display on the map and how they are ranked to ensure a clean, responsive, and useful experience.

## Overview
The stop selection process balances three goals:
1.  **Visibility**: Major transit hubs should be visible even when zoomed out.
2.  **Responsiveness**: The map should follow the user's focus (the center of the screen).
3.  **Performance**: Scaling the number of stops prevents UI lag and visual clutter.

---

## 1. Search Scope (Radius)
The search area is determined by the map's zoom level. As you zoom out, the search radius increases to cover more of the city.

- **Formula**: `Radius = Math.min(20000, 1110 * 2^(14 - zoom))`
- **Max Radius**: 20km (covers the entire Austin metro area).
- **Default**: 1km (at street level).

---

## 2. Weighted Ranking Score
To solve the "sticky stops" problem (where the map would stay stuck on a distant hub), we use a **weighted score** that considers both **Importance** and **Locality**.

### The Formula
Every stop in the search radius is assigned a score:
> **Score = (Route Count + 1) / (Distance Score + 1)**

- **Route Count**: The total number of unique bus routes serving that stop.
- **Distance Score**: The distance from the center of the map (roughly calibrated to km scale).

### How it works:
- **Major Hubs**: A stop with 15 routes (like UT or Capitol) has a high numerator, keeping it visible even if it's a few kilometers away.
- **Local Stops**: A stop with only 1 route can still reach the top of the list if it's very close to your current center (low denominator).
- **Decluttering**: This ensures "important" stops stand out globally, while "useful" stops stand out locally.

---

## 3. Dynamic Stop Limits
The number of stops displayed increases as you zoom in, allowing for a cleaner overview at high levels and more detail at street levels.

| Zoom Level | Description | Stop Limit |
| :--- | :--- | :--- |
| **High (<= 11)** | Regional/City View | **Top 20** (Major Hubs) |
| **Medium (12-14)** | Neighborhood View | **Top 40** |
| **Low (15+)** | Street View | **Top 60** |

---

## 4. Implementation Details

### Backend
`GTFSService.get_near_by_stops` selects the stops inside the map's bounding box (a `stop_lat`/`stop_lon` range filter backed by an index) and ranks them in Python:
```python
score = (route_count + 1.0) / (distance_meters * 10.0 + 1.0)
```
`distance_meters` is the haversine distance from the bounding-box center; `route_count` comes from the `routes_at_stop` cache loaded at startup.

### Frontend (React Hook)
The `useNearByStops` hook in `UseNearByStops.tsx` calculates the required radius and limit based on the current `viewState` and passes them to the GraphQL API.

---

## 5. Performance

Austin has about 2,300 stops, so even a city-wide bounding box returns a few thousand rows at most. The `stops(stop_lat, stop_lon)` index plus in-memory route counts keeps regional queries in the low tens of milliseconds without a spatial extension.
