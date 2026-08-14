---
description: 상태줄에 타이틀이 보이도록 설정합니다 (최초 1회, 기존 상태줄은 그대로 보존)
---

claude-title 상태줄을 설치합니다. 기존 statusLine 설정이 있으면 덮어쓰지 않고 보존한 뒤 타이틀만 앞에 덧붙이는 방식입니다.

Bash 도구로 아래 한 줄을 그대로 실행하세요:

```bash
S="$CLAUDE_PLUGIN_ROOT/scripts/install-statusline.cjs"; [ -f "$S" ] || S=$(find "$HOME/.claude/plugins" -name install-statusline.cjs 2>/dev/null | head -1); [ -n "$S" ] && node "$S" || echo "ERROR: 설치 스크립트를 찾지 못했습니다."
```

그리고 스크립트가 출력한 내용을 사용자에게 그대로 요약해 전달하세요. 특히 다음은 빠뜨리지 마세요:

- 기존 상태줄이 보존되었는지 여부
- 백업 파일 경로
- 반영되지 않으면 Claude Code 재시작이 필요하다는 안내

`$ARGUMENTS` 에 `--uninstall` 이 들어 있으면 위 명령의 `node "$S"` 를 `node "$S" --uninstall` 로 바꿔 실행하세요. 그러면 설치 전에 쓰던 상태줄로 복구됩니다.

설정 파일을 직접 편집하지 말고 반드시 이 스크립트를 통해서만 처리하세요. 다른 작업은 하지 마세요.
