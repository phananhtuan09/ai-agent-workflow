# Paseo plugins

Local [Paseo](https://paseo.sh) plugins, one directory per plugin.
Each directory name matches the plugin `id` in its `paseo-plugin.json`.

| Plugin | Description |
| --- | --- |
| [`attention`](attention) | After a long agent answer, a Haiku 5.5 reviewer adds a timeline note listing what needs your action, risk, or todo. |
| [`usage-pill`](usage-pill) | Composer pills showing the agent provider's plan usage (session/weekly %) and the agent's context-window use. |

## Prerequisites

- The Paseo daemon runs on this machine and the `paseo` CLI is on `PATH`.
- Node.js and npm are installed.
- The daemon version satisfies each plugin's `requirements.paseo` range; check it with `paseo daemon status --json`.

## Enable plugins on the daemon

Plugins are trusted, unsandboxed code: server code can access files, processes, credentials, and network services on the daemon machine, and client code runs inside the Paseo app.
Plugins are disabled by default.

Enable them once per daemon with **Settings → Plugins → Enable plugins** in the Paseo app.

Or set the root `"pluginsEnabled": true` field in `~/.paseo/config.json` and apply it without restarting the daemon:

```bash
paseo reload --json
```

The output must list `pluginsEnabled` in `appliedPaths`.

## Install a plugin

Run these commands from the repository root for each plugin you want, replacing `usage-pill` with the plugin directory:

```bash
cd paseo-plugins/usage-pill
npm install
npm run typecheck
paseo plugin install "$PWD"
paseo plugin ls
```

The plugin must show `running` with no error.
Paseo loads the plugin from this directory, so keep the clone in place after installing.

## Update a plugin

After pulling changes or editing the source, typecheck and reload it:

```bash
cd paseo-plugins/usage-pill
npm install
npm run typecheck
paseo plugin reload usage-pill
```

Do not restart the daemon to load source changes; a restart kills running agents.

## Troubleshoot

- `paseo plugin ls` shows the status and load error.
- `paseo plugin logs <id>` shows recent plugin output.
- A `requires Paseo >=x.y.z` install error means the daemon is older than the plugin's `requirements.paseo`; update Paseo first.

## Remove a plugin

```bash
paseo plugin remove usage-pill
```

Removing a local plugin keeps its source directory.

## Add a new plugin

```bash
paseo plugin init "$PWD/paseo-plugins/<plugin-id>"
```

Keep only the entries the plugin uses (`index.client.tsx` and/or `index.server.ts`), and add a row to the table above.
