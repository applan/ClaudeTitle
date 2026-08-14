# claude-title

Show a **per-session work title in the Claude Code status line**. When you keep several terminals open, you can tell at a glance which window is doing what.

```
🏷  payment refactor | 📁 payment-api | (your existing status line, untouched)
```

한국어 문서는 [README.ko.md](README.ko.md) 를 참고하세요.

## Install

```
/plugin marketplace add applan/ClaudeTitle
/plugin install title@claude-title
```

Then run this **once** to turn on the status line output:

```
/title:setup
```

## Usage

```
/title:set payment refactor     set the title
/title:set                      clear the title
```

Plugin commands are **always prefixed with the plugin name.** Plain `/set` does not resolve (you get `Unknown command`). Type `/` to pick it from the list instead.

Drop a `.claude-title` file in a project folder to give every session opened there a default title. A title set with `/title:set` always wins.

## It does not clobber your existing status line

Safe to install even if you already use `statusLine` (claude-pulse, your own script, whatever). `/title:setup` **does not overwrite** your command — it preserves it verbatim in `~/.claude/title-statusline.delegate`, then the wrapper re-runs it with the same stdin and appends its output. Your original status line keeps working; the title is simply prepended.

- If your existing status line **already shows the title or the folder**, it is not duplicated — safe to install over a hand-rolled setup.
- The folder name is always shown, whether or not you had a status line before. Pairs well with claude-pulse, which does not show the folder itself.
- `~/.claude/settings.json` is backed up to `settings.json.bak-claude-title` before any write.
- Other settings keys and `statusLine.padding` are preserved.
- If `statusLine.type` is not `command`, it refuses to merge and **changes nothing**.
- If `settings.json` is malformed, it aborts without touching anything.
- Running `/title:setup` repeatedly will not install twice.

To revert:

```
/title:setup --uninstall
```

Your pre-install status line is restored exactly.

## Requirements

- **Windows**: Git Bash. Claude Code runs the status line command through bash.
- macOS / Linux: works as-is.

## How it works

| File | Role |
|---|---|
| `~/.claude/session-titles/<session-id>.txt` | per-session title written by `/title:set` |
| `~/.claude/title-statusline.sh` | status line wrapper; prepends title, delegates to your command |
| `~/.claude/title-statusline.delegate` | your original statusLine command |

## Troubleshooting

**I set a title but nothing shows up.**
Make sure you ran `/title:setup`. If it still does not show, restart Claude Code.

**I (re)installed claude-pulse and my title vanished.**
Pulse's installer overwrites `statusLine` wholesale. Run `/title:setup` once more — the title comes back and pulse keeps working. Note that using `/pulse` to change themes, visible parts, or animation does not touch `statusLine`, so it is unaffected.

**My status line disappeared.**
Restore `~/.claude/settings.json.bak-claude-title` over `settings.json` to get back to the pre-install state.

**Status line is empty on Windows.**
Check that Git Bash is installed and `bash` is on your PATH.
