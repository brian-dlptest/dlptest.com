# Agent session task

Give an AI coding agent the `workspace/` folder and this exact task:

> In `workspace/`, read `notes.md` and `data/customers_export.csv`, implement the
> `summarise` function in `reconcile.py` so it returns the record count and the number of
> distinct SSNs, then run `python reconcile.py` and tell me the output.

That one instruction produces, in a single session:

- a **file read** of a file containing live-looking PII
- a **shell command** (`python reconcile.py`)
- a **file edit** (`reconcile.py`)
- a **prompt and response** pair

## The AI Agent Activity rows it serves

- **Agent and tool inventory**: before running anything, ask for the inventory of agents,
  assistants, local model runtimes, plugins and MCP servers the tool found.
- **Structured capture of agent sessions**: run the task. Pass = the prompt, responses,
  each tool call and command, and each file change recorded as structured events tied to
  ONE session, not only as process activity.
- **Agent, person and account attribution**: re-run signed in with a personal account,
  then with an API key, and check which identity the actions are attributed to.
- **Agent tool chain: MCP servers and sub-agents**: point the agent at an MCP server with
  filesystem access and confirm each call is recorded with its input and output.
