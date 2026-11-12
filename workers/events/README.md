# Rider events

Cloudflare Worker that records small, anonymous events from the site into
Workers Analytics Engine (dataset `rider_events`). Web Analytics counts page
views; these events tell us whether riders **found the next bus**, what they
searched for, and whether they come back.

What's stored per event: the event name, a random per-tab session ID, the
page type, up to four short fields (see `EVENTS` in `src/index.ts`), the
country, and two numbers. No IP address, user agent, exact location or
persistent ID. Search terms are kept so we can see what riders look for;
the client lowercases them and strips emails, phone and zip numbers and
house numbers first (`scrubSearchTerm` in `client/src/shared/track.ts`).

The client (`client/src/shared/track.ts`) sends nothing unless the build has
`VITE_EVENTS_URL` (from the `EVENTS_URL` repository variable), so local dev
and PR previews send nothing.

## Develop

```bash
cd workers/events
npm ci
npm test           # unit tests (node:test)
npm run typecheck
npm run dev        # local worker on http://localhost:8787
```

## Deploy

```bash
npx wrangler login   # once, opens browser
npm run deploy       # prints the workers.dev URL
gh variable set EVENTS_URL --body "https://rider-events.<subdomain>.workers.dev/e"
```

The next production deploy (`main.yml`) picks up the variable.

## Query

The SQL API takes a token with **Account Analytics: Read** (the same token
used for Web Analytics, `~/.config/cloudflare/analytics-token`):

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/analytics_engine/sql" \
  -H "Authorization: Bearer $(cat ~/.config/cloudflare/analytics-token)" \
  --data "SELECT blob1 AS event, blob3 AS page, SUM(_sample_interval) AS n
          FROM rider_events WHERE timestamp > NOW() - INTERVAL '7' DAY
          GROUP BY event, page ORDER BY n DESC"
```

Columns: `blob1` event, `blob2` session, `blob3` page type, `blob4`–`blob7`
event fields, `blob8` country, `double1` value (for `arrivals`: ms from
landing until a next-bus answer showed), `double2` visits by this device in
the last 7 days. Use `SUM(_sample_interval)` rather than `COUNT()`.

Useful questions:

- **Did riders find their bus?** Sessions with a `land` event that also have
  an `arrivals` event with `blob4 = 'yes'`, and how fast (`double1`).
- **What do they look for that we don't have?** `search` events with
  `blob5 = '0'` (no results), by `blob4` (term).
- **Do they come back?** `land` events with `blob6 = 'yes'`, and `double2`.
