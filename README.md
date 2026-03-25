# Nara Data Dictionary Manager

A lightweight web app for managing the Nara Organics Data Dictionary in Google Sheets — add metrics, update fields, manage data sources, sync dependencies, and log changes, all without copy-pasting.

## Setup

1. Open the app and go to **Settings → Run Setup**
2. Follow the 4-step guide to deploy `nara-dictionary-api.gs` as a Google Apps Script Web App
3. Paste your Web App URL and click **Save & Connect**

The app writes directly to the Google Sheet from that point on.

## Files

- `index.html` — the full single-file web app
- `nara-dictionary-api.gs` — the Google Apps Script backend (deploy once to Google Sheets)
