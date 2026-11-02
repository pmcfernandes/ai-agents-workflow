#!/usr/bin/env node
// Installs the skills in .agents/skills into Claude Code, Codex, GitHub Copilot and Pi.
// Zero dependencies. Requires Node.js 16.7+.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '.agents', 'skills');

// Where each tool looks for user-level skills.
const TARGETS = {
  claude: {
    label: 'Claude Code',
    dir: () => path.join(os.homedir(), '.claude', 'skills'),
  },
  codex: {
    label: 'OpenAI Codex',
    dir: () => path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills'),
  },
  copilot: {
    label: 'GitHub Copilot',
    dir: () => path.join(os.homedir(), '.copilot', 'skills'),
  },
  pi: {
    label: 'Pi',
    dir: () => path.join(os.homedir(), '.agents', 'skills'),
  },
};

const HELP = `
Usage: node install.js [options]

Options:
  -t, --target <list>   Comma-separated targets: claude,codex,copilot,pi  (default: all)
  -s, --skills <list>   Comma-separated skill names to install           (default: all)
  -m, --mode <mode>     "copy" (default) or "link" (symlink/junction to this repo)
  -d, --dir <path>      Override destination directory (only with a single target)
  -u, --uninstall       Remove the selected skills from the target directories
  -n, --dry-run         Show what would happen without changing anything
  -l, --list            List available skills and exit
  -h, --help            Show this help

Examples:
  node install.js
  node install.js --target claude,pi
  node install.js --skills sql-pro,git-workflow --mode link
  node install.js --uninstall --target copilot
`;

function parseArgs(argv) {
  const opts = {
    targets: Object.keys(TARGETS),
    skills: null,
    mode: 'copy',
    dir: null,
    uninstall: false,
    dryRun: false,
    list: false,
  };
  const list = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) fail(`Missing value for ${arg}`);
      return argv[++i];
    };
    switch (arg) {
      case '-t': case '--target': opts.targets = list(next()); break;
      case '-s': case '--skills': opts.skills = list(next()); break;
      case '-m': case '--mode': opts.mode = next(); break;
      case '-d': case '--dir': opts.dir = path.resolve(next()); break;
      case '-u': case '--uninstall': opts.uninstall = true; break;
      case '-n': case '--dry-run': opts.dryRun = true; break;
      case '-l': case '--list': opts.list = true; break;
      case '-h': case '--help': console.log(HELP); process.exit(0); break;
      default: fail(`Unknown option: ${arg}\n${HELP}`);
    }
  }

  for (const t of opts.targets) {
    if (!TARGETS[t]) fail(`Unknown target "${t}". Valid: ${Object.keys(TARGETS).join(', ')}`);
  }
  if (!['copy', 'link'].includes(opts.mode)) fail(`Invalid mode "${opts.mode}". Use copy or link.`);
  if (opts.dir && opts.targets.length !== 1) fail('--dir can only be used with a single --target.');
  return opts;
}

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function discoverSkills() {
  if (!fs.existsSync(SOURCE_DIR)) fail(`Skills directory not found: ${SOURCE_DIR}`);
  return fs
    .readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(SOURCE_DIR, d.name, 'SKILL.md')))
    .map((d) => d.name)
    .sort();
}

function selectSkills(all, requested) {
  if (!requested) return all;
  const unknown = requested.filter((s) => !all.includes(s));
  if (unknown.length) fail(`Unknown skill(s): ${unknown.join(', ')}`);
  return requested;
}

function installSkill(name, destRoot, opts) {
  const src = path.join(SOURCE_DIR, name);
  const dest = path.join(destRoot, name);
  const exists = fs.existsSync(dest) || isLink(dest);

  if (opts.dryRun) {
    console.log(`  [dry-run] ${opts.mode === 'link' ? 'link' : 'copy'} ${name} -> ${dest}${exists ? ' (replace)' : ''}`);
    return 'ok';
  }

  removePath(dest);
  if (opts.mode === 'link') {
    // 'junction' needs no admin rights on Windows; ignored elsewhere.
    fs.symlinkSync(src, dest, process.platform === 'win32' ? 'junction' : 'dir');
  } else {
    fs.cpSync(src, dest, { recursive: true });
  }
  console.log(`  ${exists ? 'updated' : 'installed'} ${name}`);
  return 'ok';
}

function uninstallSkill(name, destRoot, opts) {
  const dest = path.join(destRoot, name);
  if (!fs.existsSync(dest) && !isLink(dest)) {
    console.log(`  skipped ${name} (not installed)`);
    return 'skip';
  }
  if (opts.dryRun) {
    console.log(`  [dry-run] remove ${dest}`);
    return 'ok';
  }
  removePath(dest);
  console.log(`  removed ${name}`);
  return 'ok';
}

function isLink(p) {
  try { fs.lstatSync(p); return true; } catch { return false; }
}

function removePath(p) {
  if (!isLink(p)) return;
  const st = fs.lstatSync(p);
  if (st.isSymbolicLink()) {
    fs.unlinkSync(p); // removes the link only, never the source
  } else {
    fs.rmSync(p, { recursive: true, force: true });
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const available = discoverSkills();

  if (opts.list) {
    console.log(available.join('\n'));
    return;
  }

  const skills = selectSkills(available, opts.skills);
  const verb = opts.uninstall ? 'Uninstalling' : 'Installing';
  console.log(`${verb} ${skills.length} skill(s)${opts.dryRun ? ' (dry run)' : ''}`);

  let failures = 0;
  for (const key of opts.targets) {
    const target = TARGETS[key];
    const destRoot = opts.dir || target.dir();
    console.log(`\n${target.label} -> ${destRoot}`);
    if (!opts.dryRun && !opts.uninstall) fs.mkdirSync(destRoot, { recursive: true });

    for (const name of skills) {
      try {
        opts.uninstall ? uninstallSkill(name, destRoot, opts) : installSkill(name, destRoot, opts);
      } catch (err) {
        failures++;
        console.error(`  failed ${name}: ${err.message}`);
      }
    }
  }

  console.log(failures ? `\nDone with ${failures} error(s).` : '\nDone.');
  if (!opts.uninstall && !opts.dryRun) {
    console.log('Restart your assistant (or run /reload in Pi) to pick up new skills.');
  }
  process.exitCode = failures ? 1 : 0;
}

main();
