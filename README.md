# Israeli Red-Alert MCP Server

A **Model Context Protocol (MCP)** micro-service that exposes real-time and historical Israeli Home-Front Command (Pikud HaOref) rocket-alert data as structured **MCP tools**.  
It wraps the semi-official JSON endpoints behind the Home-Front Command public website, handles cookies / rate-limits / geo-fences, and delivers a clean TypeScript API as well as a standalone server.

> ⚠️  This project is **unofficial** and **not affiliated** with the Israel Defense Forces or the Home-Front Command. Use the data at your own risk.

---

## ✨ Features

* Type-safe `RedAlertAPI` that retrieves:
  * Current live alerts (`alerts.json`)
  * Historical alerts (`AlertsHistory.json`)
  * Location metadata (area, shelter time, region)
* Automatic Big-IP cookie handshake + custom headers to bypass the public site's WAF & geo-fence.
* Built-in **Bottleneck** rate-limiter (1 req / sec) to stay nice to the upstream server.
* Production-ready **MCP server** (`RedAlertMCPServer`) with the following tools:
  * `get_current_alerts`
  * `get_alert_history`
  * `get_location_info`
  * `count_active_alerts`
  * `get_alert_status`
  * `get_area_alerts`
  * `get_alert_category_info`
* Comprehensive Jest unit tests + optional live integration tests (`LIVE_TEST=true`).
* Strict ESLint / Prettier / `tsconfig` for a consistent codebase.

---

## 📦 Installation

```bash
# 1. Clone the repo
$ git clone https://github.com/elad12390/red_alert_mcp_server.git
$ cd red_alert_mcp_server

# 2. Install dependencies
$ npm install

# 3. Build the TypeScript sources
$ npm run build
```

Target Node.js version: **>= 18** (tested on 18 & 20).

---

## 🚀 Running the server

```bash
# Development (ts-node, auto-reload)
$ npm run dev

# Production (compiled JavaScript)
$ npm run start
```

Default port is **8080**.  
Override with the `PORT` environment variable:

```bash
PORT=3000 npm run start
```

The CLI entry point is `src/index.ts`, which creates an instance of `RedAlertMCPServer` and starts listening with graceful shutdown hooks.

---

## 🛠️ Available MCP tools

| Tool name | Parameters (JSON schema) | Description |
|-----------|--------------------------|-------------|
| `get_current_alerts` | – | Returns an array of *currently active* alerts as returned by Pikud HaOref. |
| `get_alert_history` | `{ "from": string (ISO), "to": string (ISO) }` | Returns all alerts fired between `from` and `to`. |
| `get_location_info` | `{ "locationId": string }` | Static metadata for a given location (area code, shelter time, name…). |
| `count_active_alerts` | – | Convenience wrapper that returns a single integer – the number of active alerts. |
| `get_alert_status` | – | Simple boolean indicating whether **any** alert is currently active. |
| `get_area_alerts` | `{ "areaId": string }` | All current alerts within a Home-Front area. |
| `get_alert_category_info` | `{ "categoryId": string }` | Human-readable info about Pikud HaOref's alert categories. |

A typical MCP tool invocation/response pair looks like:

```jsonc
// Request (MCP)
{
  "tool": "get_current_alerts",
  "arguments": {}
}

// Response (assistant)
{
  "text": "[{\"id\":123,\"location\":\"אשקלון\",...}]"
}
```

---

## 🧪 Testing

```bash
# Run the full Jest suite (unit + mocks)
$ npm test

# Run live integration tests against the real API (⚠️ may 403 outside IL)
$ LIVE_TEST=true npm test -- tests/integration/live-api.int.test.ts
```

* The axios layer is fully mocked under `tests/__mocks__/axios.ts` – no network requests during normal CI runs.
* Integration tests automatically un-mock axios when `LIVE_TEST` is set.

---

## 📂 Project structure

```
├── src
│   ├── red-alert-api.ts      # Axios wrapper
│   ├── server.ts             # MCP server implementation
│   ├── index.ts              # CLI bootstrap
│   └── types.ts              # Shared TypeScript types
├── tests                     # Jest unit + integration suites
├── package.json
├── tsconfig.json
└── …
```

---

## ⚖️ License

MIT © 2025-present Elad Ben-Haim

---

## 🙏 Acknowledgements

* Home-Front Command (פִּקוּד הֶעֹרֶף) for publicly exposing the alert feed.
* [Model Context Protocol](https://github.com/modelcontextprotocol) team for the SDK & spec.
* [`axios-cookiejar-support`](https://github.com/3846masa/axios-cookiejar-support) & [`tough-cookie`](https://github.com/salesforce/tough-cookie) for cookie handling magic.
* All contributors & issue reporters – your help makes this project better!
