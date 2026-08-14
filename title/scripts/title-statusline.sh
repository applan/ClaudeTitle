#!/usr/bin/env bash
# claude-title — 상태줄 타이틀 세그먼트
#
# 이 스크립트는 statusLine 명령으로 등록되어, 표준입력으로 들어온 세션 JSON에서
# 타이틀을 찾아 맨 앞에 붙입니다. 설치 전에 이미 statusLine 이 있었다면 그 명령은
# ~/.claude/title-statusline.delegate 에 그대로 보존되어, 여기서 같은 입력을 받아
# 실행된 뒤 뒤에 이어붙습니다. 즉 기존 상태줄은 아무것도 잃지 않습니다.
#
# 최종 형태:  🏷  타이틀 | 📁 폴더 | (기존 상태줄 출력)

input=$(cat)

# JSON에서 문자열 필드 하나를 꺼냅니다 (jq 의존성 없이).
# current_dir 은 workspace 안에 중첩돼 있지만 원문 전체에서 찾으므로 상관없습니다.
json_str() {
  printf '%s' "$input" \
    | grep -o "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" \
    | head -1 \
    | sed -E 's/.*:[[:space:]]*"(.*)"/\1/'
}

cwd=$(json_str current_dir)
[ -z "$cwd" ] && cwd=$(json_str cwd)
[ -z "$cwd" ] && cwd=$(json_str project_dir)
session_id=$(json_str session_id)

# 1순위: 세션 타이틀. 2순위: 프로젝트 폴더의 .claude-title 파일.
title=""
if [ -n "$session_id" ] && [ -f "$HOME/.claude/session-titles/$session_id.txt" ]; then
  title=$(head -n 1 "$HOME/.claude/session-titles/$session_id.txt" 2>/dev/null | tr -d '\r' | sed -E 's/[[:space:]]+$//')
fi
if [ -z "$title" ] && [ -n "$cwd" ] && [ -f "$cwd/.claude-title" ]; then
  title=$(head -n 1 "$cwd/.claude-title" 2>/dev/null | tr -d '\r' | sed -E 's/[[:space:]]+$//')
fi

folder=""
[ -n "$cwd" ] && folder=$(basename "$cwd" 2>/dev/null)

# 설치 시 보존해 둔 기존 statusLine 명령에 동일한 입력을 그대로 넘겨 실행합니다.
delegate_out=""
delegate="$HOME/.claude/title-statusline.delegate"
if [ -s "$delegate" ]; then
  delegate_out=$(printf '%s' "$input" | bash "$delegate" 2>/dev/null | tr -d '\r')
fi

# 기존 상태줄이 이미 보여주는 정보는 중복해서 붙이지 않습니다.
have() {
  printf '%s' "$delegate_out" | grep -qF -- "$1"
}

out=""
append() {
  if [ -z "$out" ]; then out="$1"; else out="$out | $1"; fi
}

[ -n "$title" ]  && ! have "$title"  && append "🏷  $title"
[ -n "$folder" ] && ! have "$folder" && append "📁 $folder"
[ -n "$delegate_out" ] && append "$delegate_out"

printf '%s' "$out"
