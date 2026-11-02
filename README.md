# my-agents

A personal collection of agent skills for AI coding assistants. Each skill is a self-contained `SKILL.md` (plus optional `references/` material) that teaches the assistant how to handle a specific domain or task, such as API design, Laravel development, Docker, or SQL optimization.

## Repository layout

```
my-agents/
├── .agents/
│   └── skills/
│       ├── api-designer/
│       │   ├── SKILL.md
│       │   └── references/
│       ├── backend-development/
│       │   └── SKILL.md
│       └── ...                 # one folder per skill
├── install.js                  # installs skills into Claude, Codex, Copilot and Pi
└── skills-lock.json            # provenance and integrity hashes for installed skills
```

## Included skills

| Skill | Purpose |
| --- | --- |
| `api-designer` | REST/GraphQL API design, OpenAPI specs, versioning, pagination, error handling |
| `backend-development` | Backend API, database, and microservice architecture; TDD |
| `code-reviewer` | Broad code review covering correctness, security, performance, and maintainability |
| `csharp-developer` | C# / .NET 8+, ASP.NET Core, EF Core, Blazor, MediatR |
| `database-architect` | Data-layer design, technology selection, schema modeling, migrations |
| `docker-expert` | Image optimization, container management, Docker best practices |
| `documentation-writer` | Technical documentation following the Diátaxis framework |
| `dotnet-core-expert` | .NET 8 minimal APIs, clean architecture, CQRS, JWT, AOT |
| `git-workflow` | Branching strategies, commit conventions, merge vs. rebase, conflict resolution |
| `javascript-pro` | Modern ES2023+ JavaScript, async patterns, ESM, Node.js APIs |
| `laravel-best-practices` | Laravel code patterns, Eloquent performance, validation, queues, security |
| `laravel-expert` | Production-grade Laravel 10/11+ architecture and security |
| `laravel-specialist` | Laravel models, Sanctum, Horizon, API resources, Livewire, Pest/PHPUnit |
| `nodejs-expert` | Node.js backends with Express, NestJS, and async patterns |
| `performance-optimizer` | Profiling, caching, database and frontend/backend tuning |
| `python-pro` | Python 3.11+ with type hints, async, pytest, mypy, ruff |
| `react-specialist` | React component behavior, state flow, rendering bugs, modern patterns |
| `security-reviewer` | Security audits, SAST, dependency and secrets scanning, compliance checklists |
| `sql-pro` | Query optimization, schema design, indexing, EXPLAIN analysis, dialect migration |
| `typescript-pro` | Advanced TypeScript types, type guards, tRPC end-to-end type safety |
| `vector-search-engineer` | Embedding storage and vector search with pgvector, Pinecone, Qdrant, FAISS, etc. |

## Installation

The `install.js` script copies the skills into the user-level skill directory of each supported assistant. It has no dependencies and needs Node.js 16.7 or newer.

```bash
node install.js                              # all skills, all tools
node install.js --target claude,pi           # only some tools
node install.js --skills sql-pro,git-workflow
node install.js --mode link                  # symlink/junction instead of copying
node install.js --dry-run                    # preview only
node install.js --uninstall --target copilot
node install.js --help
```

| Target | Installs to |
| --- | --- |
| `claude` (Claude Code) | `~/.claude/skills/` |
| `codex` (OpenAI Codex) | `$CODEX_HOME/skills/` (default `~/.codex/skills/`) |
| `copilot` (GitHub Copilot) | `~/.copilot/skills/` |
| `pi` (Pi) | `~/.agents/skills/` |

Use `--mode link` if you want edits in this repo to take effect immediately. Restart the assistant afterwards, or run `/reload` in Pi.

## Usage

Skills are plain Markdown and are loaded on demand by the assistant when a task matches the skill's description. To use one manually, point the assistant at the file, for example:

```
Read .agents/skills/sql-pro/SKILL.md and optimize this query: ...
```

To add a skill:

1. Create `.agents/skills/<skill-name>/SKILL.md`.
2. Give it a YAML front matter block with `name` and `description`. The description should state when the skill should be used, since that is what triggers it.
3. Optionally add a `references/` folder for supporting material.

## Provenance

`skills-lock.json` records where each skill came from (GitHub repository and path) and a `computedHash` of its contents. Use it to track upstream sources and detect local changes. Note that the hash is not a plain SHA-256 of the file as stored on disk, so compare against it with the same tool that generated it.

| Field | Meaning |
| --- | --- |
| `source` | GitHub `owner/repo` the skill was installed from |
| `skillPath` | Path to the `SKILL.md` within that repository |
| `computedHash` | Content hash of the skill at install time, used to detect changes |

## Notes

- Skills from external sources are third-party content. Review them before relying on them for sensitive work.
- Editing a skill locally will change its hash relative to `skills-lock.json`.
