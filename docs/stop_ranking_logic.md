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

### Backend (SQL)
The ranking is performed directly in the database using a PostGIS query:
```python
score = (peewee.fn.COUNT(RoutesAtStop.route_id) + 1.0) / (distance * 100.0 + 1.0)
query = (Stops.select(...).order_by(score.desc()).limit(dynamic_limit))
```

### Frontend (React Hook)
The `useNearByStops` hook in `UseNearByStops.tsx` calculates the required radius and limit based on the current `viewState` and passes them to the GraphQL API.

---

## 5. Performance Optimization

To achieve a **14x speedup** (800ms -> 60ms) for regional searches, we implemented several database-level optimizations:

### Database Indexes
- **Spatial Index (GIST)**: Added to `stops.stop_loc` to allow Postgres to perform high-speed geographic "Within Radius" filters.
- **B-tree Index**: Added to `routes_at_stop.stop_id` to speed up the join between stops and their routes.

### Optimized Query Strategy (Materialized CTE)
The database query planner often misestimates the number of stops in large radii, leading to slow "Nested Loop Joins." To fix this, we use a **MATERIALIZED CTE** in the raw SQL:

1.  **Isolate Search**: The query uses a map **Bounding Box** (`min_lat`, `min_lon`, `max_lat`, `max_lon`) and PostGIS `ST_MakeEnvelope` to precisely identify stops visible on the user's screen.
2.  **Fast Join**: It then joins this small list with the `routes_at_stop` table.
3.  **Result**: This ensures the database doesn't scan millions of rows unnecessarily, delivering consistent sub-100ms response times even for city-wide searches.
