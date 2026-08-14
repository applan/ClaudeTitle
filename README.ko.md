# claude-title

Claude Code 세션마다 **상태줄에 작업 타이틀**을 표시합니다. 터미널을 여러 개 띄워놓고 일할 때 어느 창이 무슨 작업인지 한눈에 구분됩니다.

```
🏷  결제모듈 리팩터링 | 📁 payment-api | (기존 상태줄 내용 그대로)
```

## 설치

```
/plugin marketplace add applan/ClaudeTitle
/plugin install title@claude-title
```

설치 후 **최초 1회만** 아래를 실행하세요. 상태줄 출력을 켜는 단계입니다.

```
/title:setup
```

## 사용

```
/title:set 결제모듈 리팩터링     타이틀 설정
/title:set                       타이틀 해제
```

설치·제거가 꼬였을 때는 `/title:status` 로 현재 상태를 진단할 수 있습니다 (읽기 전용).

플러그인 커맨드는 **플러그인 이름이 항상 앞에 붙습니다.** 짧게 `/set` 로는 호출되지 않습니다(`Unknown command` 가 뜹니다). 슬래시만 치면 목록에서 골라 넣을 수 있습니다.

프로젝트 폴더에 `.claude-title` 파일을 두면 그 폴더에서 여는 세션의 기본 타이틀이 됩니다. `/title:set` 로 설정한 세션 타이틀이 항상 우선합니다.

## 업데이트

플러그인을 업데이트한 뒤에는 **`/title:setup` 을 반드시 다시 실행하세요.**

상태줄 래퍼는 설치 시점에 `~/.claude/title-statusline.sh` 로 복사된 사본이라, 플러그인만 갱신하면 실제로 실행되는 스크립트는 옛날 것 그대로입니다. `/title:setup` 이 사본을 새 버전으로 덮어쓰며, 이때 `래퍼를 1.0.0 → 1.1.0 로 갱신합니다` 처럼 버전이 표시됩니다. 마지막으로 Claude Code 를 재시작하면 반영됩니다.

지금 어떤 버전이 돌고 있는지는 `/title:status` 로 확인할 수 있습니다.

## 기존 상태줄은 건드리지 않습니다

이미 `statusLine` 을 쓰고 있어도(claude-pulse, 자체 스크립트 등) 안전합니다. `/title:setup` 은 기존 명령을 **덮어쓰지 않고** `~/.claude/title-statusline.delegate` 에 그대로 보존한 뒤, 래퍼가 같은 입력으로 그 명령을 다시 실행해 출력을 뒤에 이어붙입니다. 원래 상태줄은 그대로 동작하고 타이틀만 앞에 추가됩니다.

- 기존 상태줄이 **이미 타이틀이나 폴더명을 보여주고 있으면** 중복해서 붙이지 않습니다. (직접 만들어 쓰던 분들도 그대로 설치하면 됩니다.)
- 폴더명은 기존 상태줄 유무와 관계없이 항상 표시됩니다. claude-pulse 처럼 폴더를 안 보여주는 상태줄과 함께 써도 폴더가 나옵니다.
- 설치 직전 `~/.claude/settings.json` 은 `settings.json.bak-claude-title` 로 백업됩니다.
- `theme`, `language` 등 다른 설정 키와 `statusLine.padding` 값은 모두 보존됩니다.
- `statusLine.type` 이 `command` 가 아니면 자동 병합을 포기하고 **아무것도 변경하지 않습니다.**
- `settings.json` 이 깨져 있으면 아무것도 변경하지 않고 중단합니다.
- `/title:setup` 을 여러 번 실행해도 중복 설치되지 않습니다.

되돌리려면:

```
/title:remove
```

설치 전에 쓰던 상태줄이 그대로 복구됩니다. 화면에 반영되려면 **Claude Code 를 재시작**해야 합니다.

이 플러그인은 예전에 `claude-title` 이라는 이름이었습니다. 이름이 바뀌면 업데이트로 승계되지 않아 옛 항목이 남고 `/claude-title:...` 커맨드가 목록에 계속 보이는데, `/title:remove` 가 그 등록(`enabledPlugins`, `installed_plugins.json`, 캐시 폴더)까지 함께 걷어냅니다. 건드리기 전에 `installed_plugins.json.bak-claude-title` 로 백업하며, 다른 플러그인은 손대지 않습니다.

## 요구 사항

- **Windows**: Git Bash 필요. Claude Code 가 상태줄 명령을 bash 로 실행합니다.
- macOS / Linux: 추가 설치 없이 동작합니다.

## 동작 방식

| 파일 | 역할 |
|---|---|
| `~/.claude/session-titles/<세션ID>.txt` | `/title:set` 이 저장하는 세션별 타이틀 |
| `~/.claude/title-statusline.sh` | 상태줄 래퍼. 타이틀을 앞에 붙이고 기존 명령에 위임 |
| `~/.claude/title-statusline.delegate` | 설치 전에 쓰던 statusLine 명령 원본 |

## 문제 해결

**제거했는데 타이틀이 계속 보입니다.**
`/title:status` 로 진단하세요. `래퍼 설치됨: 아니오` 인데도 타이틀이 보인다면 이 플러그인이 원인이 아닙니다. `statusLine` 명령 자체가 `session-titles` 를 직접 읽는 형태(예전에 손으로 넣은 설정)일 때 그렇습니다. `~/.claude/settings.json` 의 `statusLine` 에서 타이틀 부분을 지우거나 백업본으로 되돌리세요. 상태줄 변경은 Claude Code 를 재시작해야 확실히 반영됩니다.

**타이틀을 설정했는데 상태줄에 안 보입니다.**
`/title:setup` 을 실행한 적이 있는지 확인하세요. 그래도 안 보이면 Claude Code 를 재시작하세요.

**claude-pulse 를 (재)설치했더니 타이틀이 사라졌습니다.**
pulse 의 설치 루틴이 `statusLine` 을 통째로 덮어쓰기 때문입니다. `/title:setup` 을 한 번 더 실행하면 복구되고, pulse 상태줄도 그대로 유지됩니다. 참고로 `/pulse` 로 테마·표시항목·애니메이션을 바꾸는 것은 `statusLine` 을 건드리지 않으므로 영향이 없습니다.

**상태줄이 아예 사라졌습니다.**
`~/.claude/settings.json.bak-claude-title` 을 `settings.json` 으로 되돌리면 설치 이전 상태가 됩니다.

**Windows 에서 상태줄이 비어 있습니다.**
Git Bash 가 설치되어 있고 `bash` 가 PATH 에 있는지 확인하세요.
