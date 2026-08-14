#!/usr/bin/env bash
# claude-title — 상태줄 타이틀 세그먼트
#
# 이 스크립트는 statusLine 명령으로 등록되어, 표준입력으로 들어온 세션 JSON에서
# 타이틀을 찾아 맨 앞에 붙입니다. 설치 전에 이미 statusLine 이 있었다면 그 명령은
# ~/.claude/title-statusline.delegate 에 그대로 보존되어, 여기서 같은 입력을 받아
# 실행된 뒤 뒤에 이어붙습니다. 즉 기존 상태줄은 아무것도 잃지 않습니다.

input=$(cat)

# JSON에서 문자열 필드 하나를 꺼냅니다 (jq 의존성 없이).
json_str() {
  printf '%s' "$input" \
    | grep -o "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" \
    | head -1 \
    | sed -E 's/.*:[[:space:]]*"(.*)"/\1/'
}

cwd=$(json_str current_dir)
[ -z "$cwd" ] && cwd=$(json_str cwd)
session_id=$(json_str session_id)

# 1순위: /title 로 설정한 세션 타이틀. 2순위: 프로젝트 폴더의 .claude-title 파일.
title=""
if [ -n "$session_id" ] && [ -f "$HOME/.claude/session-titles/$session_id.txt" ]; then
  title=$(head -n 1 "$HOME/.claude/session-titles/$session_id.txt" 2>/dev/null | tr -d '\r' | sed -E 's/[[:space:]]+$//')
fi
if [ -z "$title" ] && [ -n "$cwd" ] && [ -f "$cwd/.claude-title" ]; then
  title=$(head -n 1 "$cwd/.claude-title" 2>/dev/null | tr -d '\r' | sed -E 's/[[:space:]]+$//')
fi

# 설치 시 보존해 둔 기존 statusLine 명령에 동일한 입력을 그대로 넘겨 실행합니다.
delegate_out=""
delegate="$HOME/.claude/title-statusline.delegate"
if [ -s "$delegate" ]; then
  delegate_out=$(printf '%s' "$input" | bash "$delegate" 2>/dev/null | tr -d '\r')
fi

# 기존 상태줄이 있으면 그 출력을 그대로 쓰고, 없을 때만 폴더명을 대신 보여줍니다.
if [ -n "$delegate_out" ]; then
  base="$delegate_out"
else
  base="📁 $(basename "$cwd" 2>/dev/null)"
fi

# 기존 상태줄이 이미 타이틀을 보여주고 있으면(직접 만들어 쓰던 경우 등) 중복해서 붙이지 않습니다.
if [ -n "$title" ] && ! printf '%s' "$base" | grep -qF -- "$title"; then
  printf '%s' "🏷 $title | $base"
else
  printf '%s' "$base"
fi
