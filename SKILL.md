---
name: "@elad12390/red-alert-mcp"
description: |
  MCP server for the Israeli Red Alert system (Pikud ha-oref / Home Front Command).
  Real-time rocket and missile alert monitoring for Israel. Query active alerts, filter
  by city or region, retrieve alert history, and monitor ongoing security events.
  Sources: Pikud ha-oref (Home Front Command) official API, oref.org.il.

  Trigger phrases: "red alert", "tzeva adom", "Israeli alerts", "pikud haoref",
  "rocket alerts Israel", "missile alert", "Israel security alerts", "civil defense alerts",
  "home front command", "oref alerts", "Israel rockets", "alert history Israel",
  "check alerts Tel Aviv", "active alerts Israel"
---

# Red Alert MCP (Israel)

## Core Philosophy

1. **Real-time first** — Always fetch live data; never cache alert state.
2. **City/region filtering** — Most queries specify a location; resolve Hebrew and English names.
3. **History queries** — Supports historical alert lookup by date range and area.
4. **Lightweight** — Read-only; no auth required for public alert data.
5. **Context-aware** — Always include timestamp and threat type in responses.

## Quick-Start: Common Problems

### "Are there active alerts right now?"

Query current active alerts — returns all active zones with threat type and timestamp.

### "Was Tel Aviv hit today?"

Use history endpoint with city filter and today's date range.

### "Show alerts for the north"

Filter by region (North, South, Center, Jerusalem, etc.) instead of specific city.

### "How many alerts happened this week?"

Query history with date range — returns count and list by area.

## Decision Trees

| Task | Action | Notes |
|------|--------|-------|
| Current active alerts | Live alerts endpoint | Real-time |
| Alerts by city | Filter active/history by city name | Hebrew or English |
| Alerts by region | Filter by district | North/South/Center/Jerusalem |
| Historical alerts | History endpoint + date range | Date format: YYYY-MM-DD |
| Threat type filter | Filter by category | Rockets, hostile aircraft, etc. |

## Reference Index

| File | Contents |
|------|----------|
| (no references) | All documentation is self-contained |
