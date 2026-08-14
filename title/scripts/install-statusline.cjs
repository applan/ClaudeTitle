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

// 이 플러그인은 claude-title 에서 title 로 이름이 바뀌었습니다. 이름이 바뀌면
// 업데이트로 승계되지 않아 옛 항목이 남고, /claude-title:title-setup 같은
// 커맨드가 목록에 계속 보입니다. 제거할 때 아래 항목만 정확히 걷어냅니다.
const PLUGINS_DIR = path.join(CLAUDE_DIR, 'plugins');
const INSTALLED_PLUGINS = path.join(PLUGINS_DIR, 'installed_plugins.json');
const LEGACY_KEY = 'claude-title@claude-title';
const LEGACY_CACHE = path.join(PLUGINS_DIR, 'cache', 'claude-title', 'claude-title');

const log = (msg) => process.stdout.write(msg + '\n');

// 래퍼 첫머리의 버전 주석을 읽습니다. 설치된 사본이 낡았는지 판별하는 데 씁니다.
function wrapperVersion(file) {
  try {
    const m = fs.readFileSync(file, 'utf8').match(/claude-title-wrapper-version:\s*([0-9.]+)/);
    return m ? m[1] : '(버전 표기 없음 — 1.0.x 이전)';
  } catch {
    return null;
  }
}
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
    const before = wrapperVersion(WRAPPER);
    const after = wrapperVersion(SOURCE);
    if (before !== after) {
      log(`이미 설치되어 있습니다. 래퍼를 ${before} → ${after} 로 갱신합니다.`);
    } else {
      log(`이미 설치되어 있습니다 (래퍼 ${after}). 최신 상태입니다.`);
    }
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
    log('claude-title 상태줄은 설치되어 있지 않아 상태줄은 건드리지 않았습니다.');
    // 상태줄이 이미 깨끗해도 옛 플러그인 항목은 남아 있을 수 있으므로 여기서도 정리합니다.
    if (cleanupLegacy(settings)) writeSettings(settings);
    log('제거 완료. Claude Code 를 재시작하세요.');
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
  cleanupLegacy(settings);
  writeSettings(settings);

  for (const f of [WRAPPER, DELEGATE]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  log('제거 완료. Claude Code 를 재시작하세요.');
}

// 옛 claude-title 플러그인 흔적을 걷어냅니다. settings 는 호출자가 이어서 저장합니다.
// Claude Code 가 관리하는 파일이라 반드시 백업을 남기고, 해당 키 하나만 건드립니다.
function cleanupLegacy(settings) {
  const done = [];

  if (settings.enabledPlugins && LEGACY_KEY in settings.enabledPlugins) {
    delete settings.enabledPlugins[LEGACY_KEY];
    done.push('settings.json 의 enabledPlugins');
  }

  if (fs.existsSync(INSTALLED_PLUGINS)) {
    try {
      const data = JSON.parse(fs.readFileSync(INSTALLED_PLUGINS, 'utf8'));
      if (data.plugins && LEGACY_KEY in data.plugins) {
        fs.copyFileSync(INSTALLED_PLUGINS, INSTALLED_PLUGINS + '.bak-claude-title');
        delete data.plugins[LEGACY_KEY];
        fs.writeFileSync(INSTALLED_PLUGINS, JSON.stringify(data, null, 2) + '\n', 'utf8');
        done.push('installed_plugins.json 의 설치 기록');
      }
    } catch (e) {
      log(`  주의: installed_plugins.json 을 정리하지 못했습니다 (${e.message}).`);
      log('  /plugin 메뉴에서 옛 claude-title 항목을 직접 제거하세요.');
    }
  }

  if (fs.existsSync(LEGACY_CACHE)) {
    try {
      fs.rmSync(LEGACY_CACHE, { recursive: true, force: true });
      done.push('옛 플러그인 캐시 폴더');
    } catch (e) {
      log(`  주의: 캐시 폴더를 지우지 못했습니다 (${e.message}).`);
    }
  }

  if (done.length) {
    log(`옛 ${LEGACY_KEY} 흔적을 정리했습니다: ${done.join(', ')}.`);
    log('  (/claude-title:... 커맨드는 Claude Code 재시작 후 목록에서 사라집니다)');
  }
  return done.length > 0;
}

function status() {
  const settings = readSettings();
  const sl = settings.statusLine;
  const cmd = sl && typeof sl.command === 'string' ? sl.command : null;

  log('--- claude-title 상태 진단 ---');
  log(`settings.json          : ${fs.existsSync(SETTINGS) ? SETTINGS : '(없음)'}`);
  log(`statusLine.command     : ${cmd === null ? '(설정 없음)' : cmd}`);
  log(`래퍼 설치됨            : ${cmd !== null && cmd.includes(MARKER) ? '예' : '아니오'}`);
  log(`설치된 래퍼 버전       : ${wrapperVersion(WRAPPER) || '(래퍼 없음)'}`);
  log(`이 플러그인의 래퍼 버전: ${wrapperVersion(SOURCE) || '(원본 없음)'}`);
  log(`이 플러그인 위치       : ${__dirname}`);
  log(`${WRAPPER} : ${fs.existsSync(WRAPPER) ? '있음' : '없음'}`);
  log(`${DELEGATE} : ${fs.existsSync(DELEGATE) ? '있음' : '없음'}`);
  if (fs.existsSync(DELEGATE)) {
    log(`  보존된 원래 명령     : ${fs.readFileSync(DELEGATE, 'utf8').trim()}`);
  }

  // 래퍼를 제거해도 타이틀이 계속 보이는 가장 흔한 원인:
  // 현재 statusLine 자체가 session-titles 를 직접 읽는 손수 만든 스크립트인 경우.
  if (cmd !== null && !cmd.includes(MARKER) && cmd.includes('session-titles')) {
    log('');
    log('※ 현재 statusLine 이 session-titles 를 직접 읽고 있습니다.');
    log('  이 플러그인이 아니라 예전에 손으로 넣은 설정이 타이틀을 그리는 중입니다.');
    log('  이 명령에서 타이틀 부분을 직접 지우거나, 백업본으로 되돌리세요.');
  }

  const titlesDir = path.join(CLAUDE_DIR, 'session-titles');
  const titles = fs.existsSync(titlesDir) ? fs.readdirSync(titlesDir) : [];
  log(`저장된 타이틀 파일     : ${titles.length}개`);
  log(`백업본                 : ${fs.existsSync(BACKUP) ? BACKUP : '(없음)'}`);

  let legacy = fs.existsSync(LEGACY_CACHE);
  try {
    const data = JSON.parse(fs.readFileSync(INSTALLED_PLUGINS, 'utf8'));
    if (data.plugins && LEGACY_KEY in data.plugins) legacy = true;
  } catch { /* 파일이 없거나 형식이 달라도 무시 */ }
  if ((settings.enabledPlugins || {})[LEGACY_KEY] !== undefined) legacy = true;
  log(`옛 ${LEGACY_KEY}    : ${legacy ? '남아 있음 (/title:remove 로 정리 가능)' : '없음'}`);

  const personal = path.join(CLAUDE_DIR, 'commands', 'title.md');
  if (fs.existsSync(personal)) {
    log(`개인 명령어            : ${personal} (플러그인과 별개로 존재)`);
  }
}

if (process.argv.includes('--status')) status();
else if (process.argv.includes('--uninstall')) uninstall();
else install();
