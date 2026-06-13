# Cyber Threat Intelligence Dashboard

A browser-based cyber incident intelligence dashboard for exploring incident CSV data by country, industry, year, event type, motive, and actor type.

## Features

- Upload a cyber incident CSV directly in the browser
- Interactive charts powered by Chart.js
- Filters for year, country, industry, event type, motive, and actor type
- Full-text search across incident fields
- Incident details drawer
- Export filtered results to CSV
- Static deployment ready for Railway, GitHub Pages, Netlify, or any static host

## Expected CSV columns

The dashboard works best with these columns:

```csv
event_date,event_year,affected_country,affected_organization,affected_industry,event_type,event_subtype,motive,description,actor,actor_type,actor_country,source_url
```

Your larger dataset should stay private if the repository is public. Upload it through the dashboard UI instead of committing it to GitHub.

## Run locally

Open `index.html` in your browser, or run a small local server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Railway deployment

Railway detects this as a static site and serves it with Caddy. The included `Caddyfile` listens on Railway's `$PORT` and serves `index.html`, `app.js`, `style.css`, and `sample-data.csv` from the app root.

## Privacy note

Do not commit private, licensed, or sensitive datasets into this public repository. Use the browser upload button instead.
