# Canvas Agent MCP (`canvas-agent-mcp`)

> **Model Context Protocol (MCP) server for Canvas LMS.**  
> Connects Claude and AI agents directly to Canvas LMS to automate course preparation, manage assignments and due dates, set individual student extensions, and audit academic workflows in natural language.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Standard](https://img.shields.io/badge/MCP-1.0.4-blue)](https://modelcontextprotocol.io)
[![Canvas LMS API](https://img.shields.io/badge/Canvas_LMS-REST_API-E72429)](https://canvas.instructure.com/doc/api/)

---

## 🚀 Why Canvas Agent MCP?

Managing courses in Canvas LMS through the web UI often requires navigating dozens of screens: copying content, manually shifting deadlines, configuring late policies, adding individual extensions (*overrides*), or chasing unaccepted invitations.

**Canvas Agent MCP turns Claude into an Autonomous Academic Agent:**
* **Natural Language Operations:** Ask Claude to duplicate a course, set deadlines for next term, or audit an exam submission.
* **Human-in-the-Loop Safety:** Destructive actions require user confirmation before calling Canvas APIs.
* **Open Standard:** Built with the official Anthropic `@modelcontextprotocol/sdk`.

```
┌─────────────────────────┐
│     User / Staff        │  "Duplicate course 768 for Spring 2027 starting Feb 15"
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   Claude (AI Agent)     │  Plans steps, calculates dates, asks confirmation
└───────────┬─────────────┘
            │  Model Context Protocol (stdio / JSON-RPC)
            ▼
┌─────────────────────────┐
│    canvas-agent-mcp     │  Validates inputSchema, formats requests
└───────────┬─────────────┘
            │  HTTPS REST API
            ▼
┌─────────────────────────┐
│       Canvas LMS        │  Executes course creation, assignments, calendar
└─────────────────────────┘
```

---

## 🛠️ Available MCP Tools

| Module | Tool | Description |
| :--- | :--- | :--- |
| **Courses** | `canvas_search_courses` | Search courses by name, code or term. |
| | `canvas_get_course` | Get full course details, term, and enrollment count. |
| | `canvas_duplicate_course` | Clones a course via Content Migrations API into a new shell with start/end dates. |
| | `canvas_get_duplicate_status`| Polls migration workflow state and completion percentage. |
| | `canvas_set_missing_submission_policy` | Configures the course late policy (e.g. automatic 0% for missing work). |
| **Assignments** | `canvas_list_assignments` | Lists assignments, due dates, points, and existing overrides. |
| | `canvas_update_assignment_due_date` | Updates primary due dates across the course. |
| | `canvas_set_student_due_date` | Creates an individual Assignment Override for a specific student without altering the class deadline. |
| | `canvas_remove_student_due_date` | Deletes an individual student override. |
| **Communication** | `canvas_list_announcements` | Lists active and scheduled announcements. |
| | `canvas_create_announcement` | Posts an announcement immediately or schedules it with `delayed_post_at`. |
| | `canvas_delete_announcement` | Deletes an announcement topic. |
| **Calendar** | `canvas_list_calendar_events` | Lists course calendar events and live classes. |
| | `canvas_create_calendar_event` | Schedules live webinars or sessions with meeting links (Teams / Zoom). |
| **Students & Audit** | `canvas_list_students` | Lists enrolled students, enrollment state (`active`, `invited`, `completed`), and last activity. |
| | `canvas_list_pending_invitations` | Filters students who have not accepted course invitations. |
| | `canvas_audit_submission` | Forensic review of student submission history, attempt timestamps, and rubric evaluations. |

---

## 📦 Quick Start & Installation

### 1. Requirements
* Node.js >= 18.0.0
* Canvas LMS Account with API Access Token (*Canvas > Account > Settings > Approved Integrations > New Access Token*).

### 2. Configure Claude Desktop
Add this to your `claude_desktop_config.json`:

* **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "canvas-agent": {
      "command": "npx",
      "args": ["-y", "canvas-agent-mcp"],
      "env": {
        "CANVAS_BASE_URL": "https://your-institution.instructure.com",
        "CANVAS_API_TOKEN": "your_canvas_api_token_here"
      }
    }
  }
}
```

### 3. Local Development
```bash
# Clone the repository
git clone https://github.com/GP-mando-fr/canvas-agent-mcp.git
cd canvas-agent-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
CANVAS_BASE_URL="https://your-institution.instructure.com" CANVAS_API_TOKEN="your_token" npm run dev
```

---

## 💬 Example Agent Prompts

Try asking Claude:

* *"Search for our Corporate Finance course and show me all assignments due in March."*
* *"Duplicate course 742 into a new course called 'Corporate Finance Spring 2027' starting February 15, 2027. Once duplicated, enable the 0% policy for missing submissions."*
* *"Student #1049 requested a medical extension. Give them 3 extra days on assignment #8820 without modifying the deadline for the rest of the class."*
* *"Which students are still marked as 'invited' in course 760 and haven't logged in yet?"*
* *"Schedule 4 live classes on Thursdays at 18:00 Paris time with our Teams link on the course calendar."*

---

## 🔒 Security Architecture

1. **Token Isolation:** The `CANVAS_API_TOKEN` is loaded solely through local environment variables. The LLM never sees or logs the token.
2. **Schema Validation:** All tool arguments are validated with strict `zod` schemas before any network call.
3. **Audit Trail:** Standard Canvas LMS API logging records each action against the token holder.

---

## 📄 License

MIT License © 2026 Ed-tech GP
