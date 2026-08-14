---
description: 상태줄 타이틀 표시를 제거하고 설치 전에 쓰던 상태줄로 되돌립니다
---

claude-title 상태줄을 제거하고, 설치 전에 쓰던 statusLine 을 그대로 복구합니다.

Bash 도구로 아래 한 줄을 **글자 그대로** 실행하세요. `--uninstall` 을 절대 빼지 마세요.

```bash
S="$CLAUDE_PLUGIN_ROOT/scripts/install-statusline.cjs"; [ -f "$S" ] || S=$(find "$HOME/.claude/plugins" -name install-statusline.cjs -printf "%T@ %p\n" 2>/dev/null | sort -rn | head -1 | cut -d" " -f2-); [ -n "$S" ] && node "$S" --uninstall || echo "ERROR: 제거 스크립트를 찾지 못했습니다."
```

출력에 `제거 완료` 가 포함되지 않으면 제거가 되지 않은 것입니다. 그때는 사용자에게 실패했다고 알리고, 위 명령에 `--uninstall` 이 그대로 들어갔는지 확인한 뒤 다시 실행하세요.

성공하면 다음을 안내하세요:

- 설치 전에 쓰던 상태줄이 복구되었다는 것
- `옛 claude-title@claude-title 흔적을 정리했습니다` 가 출력되었다면, 이름이 바뀌기 전 옛 플러그인 등록까지 함께 걷어냈다는 것 (`/claude-title:...` 커맨드가 재시작 후 목록에서 사라집니다)
- **Claude Code 를 재시작해야 화면에 반영된다는 것** (재시작 전까지는 이전 상태줄이 계속 그려집니다)
- 설정했던 타이틀들(`~/.claude/session-titles/`)과 백업본은 남아 있으며, 필요 없으면 지워도 된다는 것

다른 작업은 하지 마세요.
