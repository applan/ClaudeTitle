---
description: 상태줄 타이틀이 왜 안 보이는지 / 왜 안 지워지는지 현재 상태를 진단합니다
---

claude-title 의 현재 설치 상태를 진단합니다.

Bash 도구로 아래 한 줄을 그대로 실행하세요:

```bash
S="$CLAUDE_PLUGIN_ROOT/scripts/install-statusline.cjs"; [ -f "$S" ] || S=$(find "$HOME/.claude/plugins" -name install-statusline.cjs -printf "%T@ %p\n" 2>/dev/null | sort -rn | head -1 | cut -d" " -f2-); [ -n "$S" ] && node "$S" --status || echo "ERROR: 진단 스크립트를 찾지 못했습니다."
```

출력 내용을 사용자에게 그대로 보여준 뒤, 다음 기준으로 한두 줄만 덧붙여 해석해 주세요:

- `래퍼 설치됨: 아니오` 인데도 타이틀이 계속 보인다면, `statusLine.command` 자체가 `session-titles` 를 읽고 있는 것입니다. 플러그인이 아니라 예전에 손으로 넣은 설정이 원인이므로, 백업본으로 되돌리거나 해당 명령에서 타이틀 부분을 지워야 한다고 안내하세요.
- `래퍼 설치됨: 예` 인데 타이틀이 안 보인다면 Claude Code 재시작이 필요합니다.
- 어느 경우든 상태줄 변경은 Claude Code 를 재시작해야 확실히 반영된다는 점을 알려주세요.

이 명령은 읽기 전용입니다. 아무것도 수정하지 마세요.
