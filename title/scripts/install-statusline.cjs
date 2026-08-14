#!/usr/bin/env node
/*
 * claude-title 상태줄 설치 스크립트
 *
 * ~/.claude/settings.json 의 statusLine 을 claude-title 래퍼로 바꾸되,
 * 원래 있던 명령은 ~/.claude/title-statusline.delegate 에 그대로 보존합니다.
 * 래퍼가 실행될 때 그 명령을 같은 입력으로 다시 실행해 뒤에 이어붙이므로,
 * 기존 상태줄(claude-pulse 등)은 그대로 동작합니다.
 *
 *   node install-statusline.cjs              설치 / 재설치  (/title:setup)
 *   node install-statusline.cjs --uninstall  제거 후 원래 상태줄 복구
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const WRAPPER = path.join(CLAUDE_DIR, 'title-statusline.sh');
const DELEGATE = path.join(CLAUDE_DIR, 'title-statusline.delegate');
const BACKUP = path.join(CLAUDE_DIR, 'settings.json.bak-claude-title');
const SOURCE = path.join(__dirname, 'title-statusline.sh');

// settings.json 안에서 우리 래퍼를 알아보는 표식. 재실행해도 중복 설치되지 않게 합니다.
const MARKER = 'title-statusline.sh';
const COMMAND = 'bash "$HOME/.claude/title-statusline.sh"';

const log = (msg) => process.stdout.write(msg + '\n');
const fail = (msg) => { process.stdout.write('ERROR: ' + msg + '\n'); process.exit(1); };

function readSettings() {
  if (!fs.existsSync(SETTINGS)) return {};
  const raw = fs.readFileSync(SETTINGS, 'utf8').replace(/^﻿/, '').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    fail(`${SETTINGS} 를 JSON으로 읽지 못했습니다 (${e.message}). 파일을 고친 뒤 다시 실행하세요. 아무것도 변경하지 않았습니다.`);
  }
}

function writeSettings(settings) {
  fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

function backup() {
  if (fs.existsSync(SETTINGS)) {
    fs.copyFileSync(SETTINGS, BACKUP);
    log(`백업: ${BACKUP}`);
  }
}

function install() {
  if (!fs.existsSync(SOURCE)) fail(`래퍼 스크립트를 찾을 수 없습니다: ${SOURCE}`);
  fs.mkdirSync(path.join(CLAUDE_DIR, 'session-titles'), { recursive: true });

  const settings = readSettings();
  const existing = settings.statusLine;
  const alreadyInstalled =
    existing && typeof existing.command === 'string' && existing.command.includes(MARKER);

  if (existing && !alreadyInstalled) {
    if (existing.type !== 'command' || typeof existing.command !== 'string') {
      fail(
        'statusLine 이 이미 설정되어 있는데 type 이 "command" 가 아니라 자동 병합할 수 없습니다.\n' +
        '기존 설정을 보존하기 위해 아무것도 변경하지 않았습니다. 현재 값:\n' +
        JSON.stringify(existing, null, 2)
      );
    }
    backup();
    // 원래 명령을 셸 스크립트 파일로 그대로 보존합니다. 래퍼가 같은 stdin 으로 실행합니다.
    fs.writeFileSync(DELEGATE, existing.command + '\n', 'utf8');
    log('기존 상태줄을 보존했습니다. 타이틀이 그 앞에 붙습니다.');
  } else if (!existing) {
    backup();
    // 위임할 기존 상태줄이 없으면 래퍼가 폴더명을 대신 보여줍니다.
    if (fs.existsSync(DELEGATE)) fs.unlinkSync(DELEGATE);
    log('기존 상태줄이 없어 "📁 폴더명 | 🏷 타이틀" 형태로 설치합니다.');
  } else {
    log('이미 설치되어 있어 래퍼 스크립트만 최신으로 갱신합니다.');
  }

  fs.copyFileSync(SOURCE, WRAPPER);
  try { fs.chmodSync(WRAPPER, 0o755); } catch { /* Windows 에서는 무시 */ }

  const next = { ...(existing || {}), type: 'command', command: COMMAND };
  settings.statusLine = next;
  writeSettings(settings);

  log('');
  log('설치 완료. /title:set 결제모듈 처럼 입력하면 상태줄에 표시됩니다.');
  log('(현재 세션에는 바로 반영되지 않을 수 있습니다. 안 보이면 Claude Code 를 재시작하세요.)');
}

function uninstall() {
  const settings = readSettings();
  const existing = settings.statusLine;
  if (!existing || typeof existing.command !== 'string' || !existing.command.includes(MARKER)) {
    log('claude-title 상태줄이 설치되어 있지 않습니다. 아무것도 변경하지 않았습니다.');
    return;
  }
  backup();

  if (fs.existsSync(DELEGATE)) {
    // 보존해 둔 원래 명령을 되돌려 놓습니다.
    const original = fs.readFileSync(DELEGATE, 'utf8').replace(/\s+$/, '');
    settings.statusLine = { ...existing, type: 'command', command: original };
    log('설치 전에 쓰던 상태줄을 복구했습니다.');
  } else {
    delete settings.statusLine;
    log('상태줄 설정을 제거했습니다.');
  }
  writeSettings(settings);

  for (const f of [WRAPPER, DELEGATE]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  log('제거 완료. Claude Code 를 재시작하세요.');
}

if (process.argv.includes('--uninstall')) uninstall();
else install();
