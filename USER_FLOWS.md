# Austin Bus Go — User Flows & Features

This document describes the features and user flows of the Austin Bus Go web application — a real-time bus tracking tool for Austin's CapMetro transit system.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Core Features](#2-core-features)
   - [Search](#21-search)
   - [Stop Details](#22-stop-details)
   - [Route Details](#23-route-details)
   - [Trip Details](#24-trip-details)
   - [Map](#25-map)
   - [Favorites](#26-favorites)
   - [Settings (App Drawer)](#27-settings-app-drawer)
3. [User Flows](#3-user-flows)
   - [Find Upcoming Buses at a Stop](#flow-1-find-upcoming-buses-at-a-stop)
   - [Explore a Full Route](#flow-2-explore-a-full-route)
   - [Track a Specific Trip](#flow-3-track-a-specific-trip)
   - [Discover Nearby Stops](#flow-4-discover-nearby-stops)
   - [Save and Revisit Favorites](#flow-5-save-and-revisit-favorites)
   - [Share a View](#flow-6-share-a-view)
   - [Switch Between Light and Dark Mode](#flow-7-switch-between-light-and-dark-mode)
4. [Data & Real-Time Updates](#4-data--real-time-updates)
5. [Developer Debug Pages](#5-developer-debug-pages)
6. [URL Structure](#6-url-structure)

---

## 1. Application Overview

Austin Bus Go is a single-page application (SPA) that shows live and scheduled bus information for Austin's CapMetro system. It renders a full-screen interactive map with an overlay panel for search, stop details, route timelines, and trip information.

**Core technology:**
- React 18 / TypeScript frontend (Vite)
- Python Flask + GraphQL backend
- PostgreSQL database with PostGIS spatial queries
- GTFS static schedule data + GTFS Realtime feeds (live vehicle positions and trip updates)
- Mapbox GL for map rendering

---

## 2. Core Features

### 2.1 Search

**Location:** Fixed overlay panel in the top-left of the screen.

**What users can do:**
- Type a stop name, stop code, route number, or route name to search
- See autocomplete suggestions as they type (up to 8 results)
- Select a suggestion to navigate directly to that stop or route
- Press Enter to view a full search results page
- Clear the input with the X button

**Suggestion types shown in dropdown:**
| Type | Display |
|---|---|
| Stop | Stop name, stop code, badge showing routes served |
| Route | Route number badge, route long name |
| Nearby stops | Special option using current map center coordinates |
| All routes | Special option listing every CapMetro route |
| Recent searches | Previously visited stops, routes, or search terms |

**Search Results Page (`/search/:searchTerm`):**
- Full list of matching stops and routes
- Stops show: name, stop code, list of route badges
- Routes show: route ID badge, long name
- Hovering an item highlights it on the map
- Clicking navigates to the stop or route detail page

**Recent Searches (`/recent-searches`):**
- Displays all past visited stops, routes, and typed search terms
- Items can be individually removed with the X button
- Can be cleared entirely from the Settings drawer
- Persisted in `localStorage` — survives page refresh

---

### 2.2 Stop Details

**URL:** `/stop/:stopId`

**What is shown:**
- Stop name, stop ID, and wheelchair accessibility status
- Cross-street intersection (On Street / At Street)
- All routes that serve this stop (colored route badges)
- Route filter selector (when multiple routes serve the stop)
- List of upcoming bus arrivals

**Upcoming Arrivals List:**
Each arrival row shows:
- Route ID badge (color-coded by route)
- Bus destination / trip headsign
- Scheduled arrival time
- Live updated arrival time (when real-time data is available)
- Time-to-arrival countdown: `X min`, `Now`, `X min ago`, or `h:mm AM/PM`
- Status label: `On time`, `Delayed X min`, `Early X min`, or `Scheduled`
- Wheelchair accessibility and bikes-allowed icons

**Status color coding:**
| Status | Color |
|---|---|
| Scheduled (no real-time data) | Gray |
| On time | Green |
| Early | Orange |
| Delayed | Red |

**Actions available:**
- Add this stop to Favorites (bookmark icon)
- Share the current view (link icon)
- Filter arrivals by a specific route
- Click any arrival row to open full trip details

---

### 2.3 Route Details

**URL:** `/route/:routeId/direction/:directionId`

**What is shown:**
- Route banner: route number badge and full route name
- Direction toggle: switch between Outbound (direction 0) and Inbound (direction 1)
- Chronological timeline of all stops on the route for the selected direction
- Live vehicle position indicators on the timeline

**Route Stops Timeline:**
Each stop entry shows:
- Stop name
- Scheduled arrival time or live updated time
- `Live` badge (green) when real-time data is available, `Scheduled` (gray) otherwise
- Minutes until arrival countdown
- Bus icon positioned on the timeline when a vehicle is approaching or at the stop

**Live vehicle indicators:**
- A bus icon appears on the timeline adjacent to the vehicle's current stop
- Clicking the bus icon flies the map to the vehicle's position
- Hovering highlights the vehicle

**Actions available:**
- Toggle direction (Outbound / Inbound)
- Click any stop to view that stop's details (preserves route context)
- Add this route to Favorites
- Share the current view
- Click vehicle icon to focus map on that bus

**Real-time refresh:** Vehicle positions and trip updates poll every 15 seconds.

---

### 2.4 Trip Details

**URL:** Accessed by clicking an arrival on the Stop Details page. Nested under `/stop/:stopId/trip`.

**What is shown:**
- Route banner and trip destination (headsign)
- "from [Stop Name]" subtitle indicating the stop the user navigated from
- "Show route" button to switch to the full route timeline
- Full ordered list of all stops this trip visits

**Trip Timeline:**
Each stop entry shows:
- Stop name
- Scheduled arrival time
- Live updated arrival time (if real-time data available)
- Delay status: `Early`, `Delayed`, `On time`, or `Scheduled`
- Time-to-arrival countdown
- Visual emphasis on the stop the user navigated from
- Grayed-out past stops (already departed)

**Live vehicle position:**
- If the trip is currently running, a bus icon appears on the timeline
- Clicking it flies the map to the vehicle

**Navigation:**
- Click any stop in the timeline to view that stop's details
- Query parameters preserve route context across navigation

**Real-time refresh:** Trip updates poll every 15 seconds.

---

### 2.5 Map

**Type:** Full-screen Mapbox GL interactive map, centered on Austin (lat: 30.2672, lon: -97.7431, zoom: 11.5 by default).

**What is displayed on the map:**
- Stop markers (circles) for all bus stops in the current viewport
- Stop labels (visible at higher zoom levels)
- Route shape lines (colored by route) when viewing a route or trip
- Vehicle position markers with heading indicator (when available)

**Map interactions:**
| Interaction | Effect |
|---|---|
| Click a stop marker or label | Navigate to that stop's detail page |
| Hover a stop | Highlights the stop |
| Click a vehicle marker | Fly map to that vehicle's location |
| Hover a vehicle | Highlights the vehicle in the route timeline |
| Pan / zoom | Updates the URL with new view state |
| Navigation controls (bottom-right) | Zoom, rotate, pitch |
| Geolocate button | Centers map on user's current location |

**Map view state in URL:**
The map's current latitude, longitude, and zoom level are encoded into the URL path as an optional `:viewState` segment. This means:
- Panning and zooming updates the URL automatically
- Views are shareable — pasting the URL restores the exact map position
- Navigating between pages preserves the map position

**Dark mode:**
The map automatically switches Mapbox style (light vs dark) based on the app theme setting.

---

### 2.6 Favorites

**URL:** `/favorites`

**What is shown:**
- A list of stops and routes the user has bookmarked
- Empty state message with instructions when no favorites exist

**How to add a favorite:**
- On any Stop or Route detail page, click the bookmark icon
- The icon fills in to confirm the item is saved

**How to remove a favorite:**
- Click the filled bookmark icon again on the detail page (toggle behavior)
- Or manage from the Favorites list page

**Storage:** Saved in `localStorage` — persists across page refreshes and sessions.

**Navigation:** Clicking any favorite item navigates to that stop or route's detail page.

---

### 2.7 Settings (App Drawer)

**Access:** Click the hamburger menu icon (☰) in the top-left search panel.

**Sections and options:**

#### Appearance
- **Theme toggle:** Choose Light, Dark, or System (follows OS preference)

#### Vehicle Live Position
- **Auto Polling toggle:** Enable or disable automatic vehicle position refreshes every 15 seconds
- **Reload Vehicles button:** Manually trigger a vehicle position refresh

#### Search
- **Clear recent searches:** Removes all items from the recent searches history. Confirms with a snackbar notification.

#### Developer
- **React Query Devtools toggle:** Shows the React Query debugging panel in the bottom of the screen (useful for inspecting cached queries)

#### About Austin Bus Go
- Link to the GitHub repository
- **Feed Info:** Displays the start and end dates of the current GTFS static data feed loaded in the backend

---

## 3. User Flows

---

### Flow 1: Find Upcoming Buses at a Stop

**Goal:** A user wants to know when the next buses arrive at a specific stop.

```
1. User opens the app
   → Full-screen map loads, search panel visible top-left

2. User types a stop name or stop code in the search box
   → Autocomplete dropdown shows matching stops

3. User clicks a stop from the dropdown (or presses Enter and selects from results page)
   → Navigates to /stop/:stopId
   → Map flies to stop location

4. Stop Details panel loads
   → Shows stop name, ID, street intersection
   → Lists upcoming arrivals

5. Each arrival shows:
   → Route badge, destination, time countdown
   → "On time / Delayed X min / Early" status

6. User can optionally filter arrivals by a specific route
   → Click the route badge selector
   → List updates to show only that route's arrivals

7. User taps an arrival row to see the full trip timeline
   → Navigates to trip page
```

---

### Flow 2: Explore a Full Route

**Goal:** A user wants to see where a route goes and where buses currently are.

```
1. User searches for a route number or name
   → Types in search box, e.g., "Route 1"

2. User selects the route from autocomplete or search results
   → Navigates to /route/:routeId/direction/0

3. Route Details panel loads
   → Shows route banner (number + name)
   → Vertical timeline of all stops in order

4. User sees live bus positions on the timeline
   → Bus icons appear next to stops where vehicles are located
   → "Live" or "Scheduled" labels on each stop

5. User clicks the direction toggle
   → Switches from Outbound to Inbound
   → Timeline reloads for opposite direction

6. User clicks a stop in the timeline
   → Navigates to that stop's detail page
   → Route context preserved (route/direction in query params)

7. User clicks a bus icon on the timeline
   → Map flies to that vehicle's current location
```

---

### Flow 3: Track a Specific Trip

**Goal:** A user wants to track a specific bus they're waiting for and see its progress.

```
1. User navigates to a stop (via search or map click)
   → Stop Details page shows upcoming arrivals

2. User sees a bus listed for their route
   → Arrival shows "Delayed 3 min" with red status

3. User clicks the arrival row
   → Navigates to Trip Details page

4. Full trip timeline loads
   → All stops shown in order
   → Current stop (where user navigated from) is highlighted
   → Past stops are grayed out
   → Future stops show scheduled or updated arrival times

5. Live bus icon appears on timeline
   → Shows current vehicle position relative to stops

6. Timeline auto-refreshes every 15 seconds
   → Delays and estimated times update in real time

7. User clicks "Show route" to switch to the full route view
   → Navigates to Route Details page for context
```

---

### Flow 4: Discover Nearby Stops

**Goal:** A user wants to find bus stops near their current location or a place on the map.

```
1. User opens the app and pans/zooms the map to an area of interest

2. User clicks in the search box and selects "Nearby stops"
   → Uses the current map center coordinates

   OR

   User clicks the geolocate button on the map
   → Map centers on user's GPS location

3. Search results page loads
   → Lists stops near the map center, ranked by:
     - Number of routes served (more routes = higher rank)
     - Distance from center (closer = higher rank)

4. User selects a stop from the list
   → Navigates to Stop Details page
   → Sees upcoming arrivals
```

---

### Flow 5: Save and Revisit Favorites

**Goal:** A user frequently uses specific stops and wants quick access.

```
1. User navigates to a stop or route detail page

2. User clicks the bookmark icon
   → Icon fills in (bookmarked)
   → Item saved to localStorage

3. User opens hamburger menu → navigates to Favorites (/favorites)
   → Lists all saved stops and routes

4. User clicks a favorite stop
   → Navigates to that stop's detail page with upcoming arrivals

5. To remove a favorite:
   → On the detail page, click the filled bookmark icon again
   → Icon becomes unfilled, item removed from favorites
```

---

### Flow 6: Share a View

**Goal:** A user wants to share the current stop or route view with someone else.

```
1. User is on a Stop Details or Route Details page

2. User clicks the Share button
   → Copies the current URL to clipboard

3. The URL includes:
   → Page path (/stop/:stopId or /route/:routeId/direction/:directionId)
   → Map view state (:viewState) encoding latitude, longitude, zoom

4. Recipient opens the link
   → App opens to the same stop or route
   → Map is centered at the same position and zoom level
```

---

### Flow 7: Switch Between Light and Dark Mode

**Goal:** A user wants to change the app theme.

```
1. User clicks the hamburger menu (☰) icon

2. App Drawer opens on the left

3. Under "Appearance", user selects Light, Dark, or System

4. App theme updates immediately
   → Material-UI colors switch
   → Mapbox map style switches to match (light/dark)

5. Preference is saved to localStorage
   → Persists across page refreshes
```

---

## 4. Data & Real-Time Updates

Austin Bus Go combines two data sources:

### Static GTFS Data (CapMetro)
Loaded into PostgreSQL. Updated periodically via the ETL pipeline.

| Data | Description |
|---|---|
| Routes | Route IDs, names, colors |
| Stops | Stop IDs, names, coordinates, street info |
| Trips | Trip IDs, headsigns, direction (0=outbound, 1=inbound) |
| Stop Times | Scheduled arrivals and departures per trip |
| Shapes | Geographic route paths (LineStrings) |
| Calendar | Service days and exception dates |

### GTFS Realtime Data (CapMetro)
Fetched live from CapMetro protobuf feeds on each query.

| Data | Description |
|---|---|
| Vehicle Positions | Current lat/lon, bearing, speed, stop status |
| Trip Updates | Per-stop delay predictions and updated arrival times |

### Refresh Intervals

| Data | Refresh Rate |
|---|---|
| Arrival times at a stop | On demand (page load) |
| Trip update delays | Every 15 seconds |
| Vehicle positions on route | Every 15 seconds (when auto-polling is on) |
| Route/stops/shapes | On demand (cached by React Query) |

---

## 5. Developer Debug Pages

Available at `/dev/*` — intended for development and testing purposes.

### `/dev/vehicles` — Vehicle Positions Table

A table of all currently active vehicles across the entire CapMetro network.

**Columns:** Route, Vehicle ID, Label, Trip ID, Stop ID, Stop Sequence, Status, Position (lat/lon), Last Updated

**Features:**
- Sortable columns
- Auto-refreshes every 15 seconds
- Manual refresh button
- Status color coding: Incoming (yellow), Stopped At (red), In Transit (green)
- Shows total active vehicle count and number of routes active

### `/dev/trip-stop-times` — Trip Stop Times

Inspection tool for viewing scheduled stop time data for individual trips.

### `/dev/stops` — Stops Data

Inspection tool for viewing raw stop records from the database.

---

## 6. URL Structure

All routes support an optional `:viewState` segment that encodes the map position (lat, lon, zoom). This keeps the map in sync with navigation and enables sharable links.

| URL Pattern | Page |
|---|---|
| `/` | Root (redirects to default view) |
| `/search/:searchTerm/:viewState?` | Search results |
| `/recent-searches/:viewState?` | Recent search history |
| `/favorites/:viewState?` | Saved favorites |
| `/stop/:stopId/:viewState?` | Stop details + arrival times |
| `/stop/:stopId/.../trip/:tripId` | Trip details (nested under stop) |
| `/route/:routeId/direction/:directionId/:viewState?` | Route details + timeline |
| `/dev/vehicles` | Debug: all vehicle positions |
| `/dev/trip-stop-times` | Debug: trip stop times inspector |
| `/dev/stops` | Debug: stops data inspector |
