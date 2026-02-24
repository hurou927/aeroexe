# Aeroexe

Helper scripts for [AeroSpace](https://github.com/nikitabobko/AeroSpace) window manager on macOS.

## Features

- **Window Cycling** — Cycle focus between windows of the same application on the current monitor (`next` / `prev`)
- **Monitor Cycling** — Cycle focus between monitors (`next` / `prev`)

## Requirements

- macOS with [AeroSpace](https://github.com/nikitabobko/AeroSpace) installed
- [Deno](https://deno.land/) (via [mise](https://mise.jdx.dev/) or standalone)
- `jq` (for the monitor cycling script)

## Usage

### Window Cycling

```bash
# Cycle to the next window of the same application
./main.ts next

# Cycle to the previous window
./main.ts prev

# Enable debug logging
./main.ts next --debug
```

### Monitor Cycling

```bash
# Cycle to the next monitor (default)
./scripts/next-monitor.bash

# Cycle to the previous monitor
./scripts/next-monitor.bash prev
```

### AeroSpace Config Example

Add keybindings to your `~/.aerospace.toml`:

```toml
[mode.main.binding]
alt-tab = 'exec-and-forget /path/to/aeroexe/main.ts next'
alt-shift-tab = 'exec-and-forget /path/to/aeroexe/main.ts prev'
ctrl-tab = 'exec-and-forget /path/to/aeroexe/scripts/next-monitor.bash next'
ctrl-shift-tab = 'exec-and-forget /path/to/aeroexe/scripts/next-monitor.bash prev'
```

## Development

```bash
# Run with file watching
deno task dev
```

## License

[MIT](LICENSE.md)
