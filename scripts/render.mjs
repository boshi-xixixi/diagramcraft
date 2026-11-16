#!/usr/bin/env node
/**
 * 图构 DiagramCraft · Skill 渲染脚本
 *
 * 用法：
 *   node scripts/render.mjs --type flow --file examples/flow.txt --out flow.png
 *   node scripts/render.mjs --type uml  --text "类 学生\n属性:\n  +学号: string" --out uml.svg
 *
 * 原理：调用本机 Chrome / Chromium 的无头模式打开 renderer/index.html?bare=1
 *      → 页面渲染出纯 SVG → 直接截图得到 PNG，或从 DOM 中取出 SVG 文本。
 * 零 npm 依赖，只需本机装有 Chrome（或用 CHROME_PATH 指定）。
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RENDERER = resolve(HERE, '../renderer/index.html');

const TYPES = ['module', 'flow', 'usecase', 'architecture', 'sequence', 'uml', 'er', 'globalEr', 'table'];

function parseArgs(argv) {
  const out = { type: 'module', scale: 2 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) fail('参数 ' + a + ' 缺少取值');
      return v;
    };
    if (a === '--type' || a === '-t') out.type = next();
    else if (a === '--text') out.text = next();
    else if (a === '--file' || a === '-f') out.file = next();
    else if (a === '--out' || a === '-o') out.out = next();
    else if (a === '--scale') out.scale = Number(next());
    else if (a === '--svg') out.svg = true;
    else if (a === '--png') out.svg = false;
    else if (a === '--help' || a === '-h') out.help = true;
    else if (!a.startsWith('-')) out.file = a;
    else fail('未知参数：' + a);
  }
  return out;
}

function fail(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ].filter(Boolean);
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // 最后尝试 PATH 里的命令
  for (const name of ['google-chrome', 'chrome', 'chromium', 'chromium-browser', 'msedge']) {
    const r = spawnSync(name, ['--version'], { encoding: 'utf8' });
    if (!r.error && r.status === 0) return name;
  }
  return null;
}

function runChrome(chrome, args, timeout = 60000) {
  const r = spawnSync(chrome, args, { encoding: 'utf8', timeout, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) fail('调用 Chrome 失败：' + r.error.message);
  if (r.status !== 0 && !r.stdout) {
    fail('Chrome 退出码 ' + r.status + '\n' + (r.stderr || '').slice(0, 800));
  }
  return r;
}

function buildUrl(text, type, extra = '') {
  const q = new URLSearchParams({ type, text, bare: '1' });
  const u = pathToFileURL(RENDERER);
  u.search = q.toString();
  return u.href + extra;
}

function extractSvg(dom) {
  const m = dom.match(/<svg[^>]*id="stage"[\s\S]*?<\/svg>/);
  if (!m) return null;
  let svg = m[0];
  if (!/xmlns=/.test(svg.slice(0, svg.indexOf('>') + 1))) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const w = /width="([\d.]+)"/.exec(svg);
  const h = /height="([\d.]+)"/.exec(svg);
  return { svg, width: w ? Number(w[1]) : 0, height: h ? Number(h[1]) : 0 };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    return;
  }
  if (!TYPES.includes(args.type)) fail('type 只能是：' + TYPES.join(' | '));

  let text = args.text;
  if (args.file) {
    if (!existsSync(args.file)) fail('找不到输入文件：' + args.file);
    text = readFileSync(args.file, 'utf8');
  }
  if (!text || !text.trim()) fail('请用 --text 或 --file 提供图表文本');
  if (!existsSync(RENDERER)) fail('找不到渲染器：' + RENDERER);

  const chrome = findChrome();
  if (!chrome) fail('未找到 Chrome / Chromium，可通过环境变量 CHROME_PATH 指定可执行文件');

  const wantSvg = args.svg || /\.svg$/i.test(args.out || '');
  const out = resolve(args.out || ('diagram.' + (wantSvg ? 'svg' : 'png')));
  const profile = mkdtempSync(join(tmpdir(), 'diagramcraft-'));

  try {
    const dom = runChrome(chrome, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--user-data-dir=' + profile, '--virtual-time-budget=3000',
      '--dump-dom', buildUrl(text, args.type)
    ]).stdout;

    const parsed = extractSvg(dom);
    if (!parsed || !parsed.width || !parsed.height) {
      fail('页面没有渲染出图形，请检查输入文本是否符合「' + args.type + '」的语法');
    }

    if (wantSvg) {
      writeFileSync(out, '<?xml version="1.0" encoding="UTF-8"?>\n' + parsed.svg, 'utf8');
    } else {
      const scale = Math.max(1, Math.min(4, args.scale || 2));
      const w = Math.ceil(parsed.width);
      const h = Math.ceil(parsed.height);
      runChrome(chrome, [
        '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
        '--user-data-dir=' + profile, '--virtual-time-budget=3000', '--hide-scrollbars',
        '--force-device-scale-factor=' + scale,
        '--window-size=' + w + ',' + h,
        '--screenshot=' + out,
        buildUrl(text, args.type)
      ]);
      if (!existsSync(out)) fail('截图失败，未生成 PNG');
    }

    const size = statSync(out).size;
    console.log(JSON.stringify({
      ok: true,
      type: args.type,
      width: parsed.width,
      height: parsed.height,
      file: out,
      bytes: size,
      format: wantSvg ? 'svg' : 'png'
    }, null, 2));
  } finally {
    try { rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }
}

main();
