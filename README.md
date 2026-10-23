# Atlas: an autonomous AI agent you run yourself

Give Atlas a task. It makes a plan, searches and browses the web, runs code, and writes files on its own while you
watch it work live, then hands you the results. Powered by Claude.

**[▶ Try the live demo](https://andyww12345-atlas-demo.static.hf.space)** (read-only: open the example task in the
sidebar to watch a recorded run play back step by step).

## What it can do

- **Do tasks end to end:** research with cited sources, data analysis, writing, coding, websites and documents. The
  plan appears as steps, and every action shows up as it happens.
- **Its own computer:** a "Computer" panel shows what the agent is doing: terminal output, files being written, and a
  real Chrome browser streamed live. Replay any step afterwards.
- **A real browser:** each task gets its own isolated Chrome session. The agent reads pages as numbered elements and
  clicks, types, fills forms, opens tabs and downloads files.
- **Asks before acting:** approval cards before anything irreversible (sending, buying, moving mail), a take-over mode
  where you drive the browser yourself (2-step codes, CAPTCHAs), and encrypted saved logins the AI never sees.
- **Build:** websites (templates, or start from an existing site), chatbots, mobile web apps, games, automations and
  Jupyter notebooks (executed, with charts, viewable in the app).
- **Create:** slides (themes, HTML or PowerPoint), documents, spreadsheets, visualizations, plus code-made designs
  (PNG), motion-graphics videos (WebM) and audio (narration and sound effects).
- **Library, Projects, Automations, Plugins:** reuse uploaded files, group tasks with shared instructions, run tasks
  on a schedule, from a webhook, or when a condition you describe becomes true, and connect apps over MCP.
- **Models and cost control:** switch between Claude Haiku 5.5, Sonnet 5.5 and Opus 5.5 at any time. A local
  credit budget (300 credits a day by default, 1 credit ≈ $0.01) stops tasks before they overspend.

## Quick start (your own API key)

You need Python 3.11+, an [Anthropic API key](https://console.anthropic.com/), and Google Chrome (or run
`.venv/bin/playwright install chromium` after the first start). Built and tested on macOS; Linux works except the
Mac-only voices used by Audio tasks.

```bash
git clone https://github.com/AndyWW214434/atlas-agent.git
cd atlas-agent
export ANTHROPIC_API_KEY=sk-ant-...
./run.sh
```

Then open http://localhost:8765. `run.sh` creates a virtual environment and installs the dependencies on first run.
For video tasks, also run `.venv/bin/playwright install ffmpeg` once.

All tasks are billed to **your** API key. The default model is Claude Haiku 5.5, the cheapest; change the default with
`AGENT_MODEL`, and set the daily credit budget under **Upgrade** (it only changes the local budget, nothing is charged).

## ⚠️ Safety

Atlas runs shell commands and a browser **on the computer it is installed on, as your user. They are not sandboxed.**
Run it on your own machine for yourself, and only give it tasks you'd be comfortable running yourself. Don't expose it
to the internet: it has no user accounts, so anyone who can reach it could run commands on your machine and spend your
API key. To let others try it, publish a read-only demo instead (below).

## Publish a read-only demo

The live demo above is a static site: no server, no AI calls, and no API key, so it costs nothing and visitors can't
spend anything. To make your own from tasks you've run:

```bash
.venv/bin/python deploy/build_static.py TASK_ID [TASK_ID ...]
```

This writes `deploy/static/`: the full interface plus the chosen tasks, with browser cookies, local paths and your
username removed (the script refuses to finish if any remain). Upload that folder to any static host, such as a free
Hugging Face **static** Space, GitHub Pages or Netlify. `deploy/build_hf.py` builds a Docker version of the same
read-only demo, for hosts that run containers.

## How it works

| Path | Purpose |
|---|---|
| `app/agent.py` | Agent loop on the Claude API (streaming, adaptive thinking, tools), task state, persistence, live event bus, Build/Create modes |
| `app/tools.py` | Tool definitions and implementations: plan, ask user, shell, files, browser |
| `app/browser.py` | Per-task Chrome session (Playwright): numbered-element snapshots, tabs, downloads, live screencast, take-over, sign-in |
| `app/server.py` | FastAPI routes: tasks, live stream (SSE), files, library, projects, automations + scheduler, plugins, credits |
| `app/features.py` | Library, projects, automations, plugins (MCP connectors), credits |
| `app/vault.py` | Encrypted saved logins and connector tokens (key kept in the system keychain) |
| `app/media.py` | Renders HTML to PNG or video with headless Chrome (Design and Video tasks) |
| `static/` | The web app: plain HTML/CSS/JS, no build step |
| `deploy/` | Scripts that build the read-only demo (static site or Docker) |

Everything you create lives in `data/`, which is never committed: tasks and their files, Library uploads, saved
logins and browser cookies.

## License

MIT. See [LICENSE](LICENSE). Brand logos on the Plugins page come from [Simple Icons](https://simpleicons.org) (CC0);
the trademarks belong to their owners.
