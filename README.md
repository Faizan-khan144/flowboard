<div align="center">

<img src="docs/screenshots/landing.png" alt="Flowboard landing page" width="100%" />

# Flowboard

**A Linear-style issue tracker you can actually run yourself.**
Boards, cycles, timeline, inbox, live presence and an owner-approved invite flow — React 19 on the front, Express + Prisma + Socket.IO on the back.

[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma&logoColor=white)](https://prisma.io)
[![SQLite](https://img.shields.io/badge/SQLite-file%3Adev.db-003b57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-010101?logo=socketdotio&logoColor=white)](https://socket.io)
[![License](https://img.shields.io/badge/license-MIT-22c55e)](LICENSE)

</div>

---

## Why it exists

Most trackers are either a spreadsheet with extra steps or an enterprise suite that needs three admins before you can file a bug. Flowboard keeps the parts that make a small team fast — a board you can drag, cycles that close on time, an inbox that only pings you when it matters — and skips the org chart.

It ships as **two small apps and one SQLite file**. Clone it, `npm install`, and you have a running workspace in under a minute. No cloud account, no seat maths, no tracker scripts.

## Screenshots

| Dashboard | Board |
| --- | --- |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Board](docs/screenshots/board.png) |

| Issue list | Timeline |
| --- | --- |
| ![Issue list](docs/screenshots/issues.png) | ![Timeline](docs/screenshots/timeline.png) |

| Cycles | Analytics |
| --- | --- |
| ![Cycles](docs/screenshots/cycles.png) | ![Analytics](docs/screenshots/analytics.png) |

| Inbox | Team & invites |
| --- | --- |
| ![Inbox](docs/screenshots/inbox.png) | ![Team](docs/screenshots/team.png) |

| Settings | Onboarding |
| --- | --- |
| ![Settings](docs/screenshots/settings.png) | ![Welcome](docs/screenshots/welcome.png) |

<details>
<summary>Marketing pages</summary>

| Landing | Pricing |
| --- | --- |
| ![Landing](docs/screenshots/landing.png) | ![Pricing](docs/screenshots/pricing.png) |

| Features | Docs |
| --- | --- |
| ![Features](docs/screenshots/features.png) | ![Docs](docs/screenshots/docs.png) |

| Changelog | About | Contact |
| --- | --- | --- |
| ![Changelog](docs/screenshots/changelog.png) | ![About](docs/screenshots/about.png) | ![Contact](docs/screenshots/contact.png) |

| Sign in | Invite landing |
| --- | --- |
| ![Sign in](docs/screenshots/login.png) | ![Join](docs/screenshots/join.png) |

</details>

## Features

**Issues.** Backlog → Todo → In progress → Done → Canceled, four priority levels, estimates, due dates, parent/child sub-issues, duplicate, comments with emoji reactions, watchers, and `@mentions` that land in someone's inbox.

**Five ways to look at the same data.**
- **Board** — drag cards between columns (grouped by status, priority or assignee), quick-add per column, multi-select bulk actions, CSV export.
- **List** — grouped rows, `j`/`k`/`Enter`/`x` keyboard navigation, inline status editing.
- **Timeline** — a Gantt of every issue, zoom from weeks to quarters, "today" marker, hide-done toggle.
- **Analytics** — eight-week created/completed velocity, priority mix, per-assignee load, label usage, completion ring.
- **Cycles** — active cycle hero card, scope, progress, date shifting, roll unfinished work into the next cycle.

**Filters that are actually reusable.** A search box plus status / priority / assignee / label / due-date / project filters, sorting, grouping, all mirrored into the URL so a filtered view is a link you can paste. Saved views then show up in the sidebar.

**Realtime.** Socket.IO keeps presence, card moves, comments, reactions and notifications in sync across every open tab, and every workspace change broadcasts to the whole team — not just the person who clicked.

**Workspaces and people.** Owners manage projects, roles and approvals; members move work; viewers read. Invite by link, and the **owner approves everyone before they get in**. Being signed in and being a member are treated as different things.

**Honest by default.** No invented teammates, no fake testimonials, no tracking scripts. A new workspace is seeded with a starter backlog owned by *you* — one real member, 14 real issues you can edit or delete.

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19, React Router 7, Tailwind CSS 4, Zustand 5 |
| Motion | hand-rolled CSS keyframes + IntersectionObserver reveals, `@react-three/fiber`/Three.js on the landing hero |
| API | Express 5, JWT auth (bcryptjs), Zod-free hand-rolled validation |
| Data | Prisma 6 + SQLite (`file:./dev.db`) |
| Realtime | Socket.IO with per-team and per-project rooms |
| Build | Vite 8 for the client, plain Node ESM for the server |

## Getting started

```bash
# 1. API
cd server
npm install
cp .env.example .env     # or create it by hand, see below
npx prisma db push       # creates dev.db from schema.prisma
npm run dev              # http://localhost:4000

# 2. Client (new terminal)
cd client
npm install
npm run dev              # http://localhost:5173
```

`server/.env`:

```ini
DATABASE_URL="file:./dev.db"
PORT=4000
JWT_SECRET="change-me-in-production"
CLIENT_ORIGIN="http://localhost:5173"
```

Open http://localhost:5173. You can either **continue as guest** (which seeds a private starter workspace owned by you) or **create an account** with email + password.

### Useful scripts

| Where | Command | What it does |
| --- | --- | --- |
| `server` | `npm run dev` | API with `--watch` reload |
| `server` | `npm run db:push` | Sync `schema.prisma` into SQLite |
| `server` | `npm run db:studio` | Prisma Studio |
| `server` | `node reset-demo.mjs` | Wipe seeded/demo data and start clean |
| `server` | `node smoke.mjs` | End-to-end API smoke test (auth, issues, cycles, invites, approvals) |
| `client` | `npm run dev` | Vite dev server |
| `client` | `npm run build` | Production build |
| `client` | `npm run lint` | oxlint |

## Project layout

```
flowboard/
├── client/                  React app
│   ├── src/components/      shell, drawer, composer, command menu, filter bar
│   ├── src/pages/           app routes + marketing pages
│   ├── src/lib/             api client, sockets, constants, url-synced filters
│   └── src/store/           zustand auth + ui stores
├── server/                  Express API
│   ├── src/routes/          auth, teams, projects, issues, cycles, labels, search, users, join, notifications, demo
│   ├── src/{auth,access}.js token + permission helpers
│   ├── src/{events,index}.js socket rooms and HTTP wiring
│   ├── prisma/schema.prisma 11 models, cascade-safe relations
│   └── smoke.mjs            API smoke test
└── docs/screenshots/        images used in this README
```

## Data model

`User` → `TeamMember` → `Team` → `Project` → `Issue`, plus `Label` / `IssueLabel`, `Cycle`, `Comment` / `Reaction`, `Activity`, `Notification`, `Invite`, `JoinRequest`, `StarredProject` and `SavedView`. Issue numbers are unique per project, so keys read like `MAIN-12`.

## API sketch

| Method | Route | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/signup`, `/api/auth/login` | returns a 7-day JWT |
| `GET` | `/api/teams/:teamId` | team, members, projects, labels, invites, join requests |
| `GET` | `/api/issues?teamId=` | filters, sorting, counts |
| `POST` `PATCH` `DELETE` | `/api/issues`, `/api/issues/:id` | create, edit, delete, bulk variants |
| `POST` | `/api/issues/:id/duplicate` | copy an issue with its labels |
| `POST` `PATCH` `DELETE` | `/api/issues/:id/comments` | comments, `@mention` notifications |
| `GET` `POST` `PATCH` `DELETE` | `/api/cycles` | cycles plus `/rollover` |
| `GET` `POST` | `/api/users/me/dashboard`, `/api/users/me/analytics` | real, computed summaries |
| `GET` | `/api/join/:token` | public invite preview |
| `POST` | `/api/join/:token/request` | ask to join; owner approves via `/api/teams/:id/requests/:requestId` |
| `GET` | `/api/notifications` | list, mark read/unread, clear |

Realtime rooms: `team:<id>` for everything happening in a workspace, `project:<id>` for a board you have open, `user:<id>` for personal notifications.

## Design notes

- **No fake content.** Every number on screen comes from the database; the marketing pages avoid invented customers, logos and metrics.
- **Motion with restraint.** Transform/opacity only, no animated blur, no full-screen canvas noise, and a reduce-motion escape hatch in Settings.
- **One theme, two densities.** A light token set (`--fg`, `--line`, `--accent` …) plus a collapsible sidebar.

## Roadmap

- [ ] Notion/Linear import so an existing backlog can move in
- [ ] Notification digests instead of one row per event
- [ ] GitHub sync: link a branch or PR to an issue key
- [ ] Playwright suite on top of the API smoke test
- [ ] Optional Postgres datasource for hosted deployments

## License

MIT — see [LICENSE](LICENSE).

<div align="center"><sub>Built by <a href="https://github.com/Faizan-khan144">Faizan Khan</a>.</sub></div>
