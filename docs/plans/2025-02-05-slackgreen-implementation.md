# SlackGreen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Node.js CLI tool that keeps Slack status active during work hours and manages scheduled status changes.

**Architecture:** CLI entry point parses commands and delegates to modules. Scheduler runs time-based checks. Slack module wraps API calls. Config module handles file I/O. Daemon module manages background process.

**Tech Stack:** Node.js, @slack/web-api, commander, node-schedule

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `bin/slackgreen.js`
- Create: `.gitignore`

**Step 1: Initialize npm project**

Run: `npm init -y`

**Step 2: Install dependencies**

Run: `npm install @slack/web-api commander node-schedule`

**Step 3: Create .gitignore**

```gitignore
node_modules/
.DS_Store
```

**Step 4: Create CLI entry point stub**

Create `bin/slackgreen.js`:

```javascript
#!/usr/bin/env node

const { program } = require('commander');

program
  .name('slackgreen')
  .description('Keep Slack status green and manage scheduled status changes')
  .version('1.0.0');

program.parse();
```

**Step 5: Configure package.json bin field**

Add to package.json:
```json
{
  "bin": {
    "slackgreen": "./bin/slackgreen.js"
  }
}
```

**Step 6: Make CLI executable and test**

Run: `chmod +x bin/slackgreen.js && node bin/slackgreen.js --help`
Expected: Shows help with name, description, version

**Step 7: Commit**

```bash
git add package.json package-lock.json bin/slackgreen.js .gitignore
git commit -m "feat: initialize project with CLI entry point"
```

---

## Task 2: Config Module

**Files:**
- Create: `src/config.js`
- Create: `src/config.test.js`

**Step 1: Write failing test for config loading**

Create `src/config.test.js`:

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadConfig, getConfigPath, DEFAULT_CONFIG } = require('./config');

describe('config', () => {
  const testDir = path.join(os.tmpdir(), 'slackgreen-test-' + Date.now());
  const testConfigPath = path.join(testDir, 'config.json');

  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('getConfigPath returns ~/.slackgreen/config.json', () => {
    const configPath = getConfigPath();
    expect(configPath).toBe(path.join(os.homedir(), '.slackgreen', 'config.json'));
  });

  test('loadConfig returns config when file exists', () => {
    const testConfig = {
      slackToken: 'xoxp-test-token',
      workHours: { start: '09:00', end: '18:00' },
      presencePingInterval: 5,
      defaultStatus: { emoji: ':green_circle:', text: 'Available' },
      statusOverrides: []
    };
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig));

    const config = loadConfig(testConfigPath);
    expect(config).toEqual(testConfig);
  });

  test('loadConfig throws when file does not exist', () => {
    expect(() => loadConfig(testConfigPath)).toThrow('Config file not found');
  });

  test('DEFAULT_CONFIG has required structure', () => {
    expect(DEFAULT_CONFIG).toHaveProperty('slackToken');
    expect(DEFAULT_CONFIG).toHaveProperty('workHours.start');
    expect(DEFAULT_CONFIG).toHaveProperty('workHours.end');
    expect(DEFAULT_CONFIG).toHaveProperty('presencePingInterval');
    expect(DEFAULT_CONFIG).toHaveProperty('defaultStatus.emoji');
    expect(DEFAULT_CONFIG).toHaveProperty('defaultStatus.text');
    expect(DEFAULT_CONFIG).toHaveProperty('statusOverrides');
  });
});
```

**Step 2: Install jest and configure**

Run: `npm install --save-dev jest`

Add to package.json:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

**Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - Cannot find module './config'

**Step 4: Write config module implementation**

Create `src/config.js`:

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.slackgreen');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  slackToken: 'xoxp-your-token-here',
  workHours: {
    start: '09:00',
    end: '18:00'
  },
  presencePingInterval: 5,
  defaultStatus: {
    emoji: ':large_green_circle:',
    text: 'Available'
  },
  statusOverrides: [
    {
      start: '11:30',
      end: '12:30',
      emoji: ':bento:',
      text: 'Lunch'
    }
  ]
};

function getConfigPath() {
  return CONFIG_PATH;
}

function getConfigDir() {
  return CONFIG_DIR;
}

function loadConfig(configPath = CONFIG_PATH) {
  if (!fs.existsSync(configPath)) {
    throw new Error('Config file not found. Run "slackgreen init" first.');
  }
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

function saveConfig(config, configPath = CONFIG_PATH) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  DEFAULT_CONFIG,
  getConfigPath,
  getConfigDir,
  loadConfig,
  saveConfig
};
```

**Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/config.js src/config.test.js package.json package-lock.json
git commit -m "feat: add config module with load/save functionality"
```

---

## Task 3: Slack API Module

**Files:**
- Create: `src/slack.js`
- Create: `src/slack.test.js`

**Step 1: Write failing test for Slack module**

Create `src/slack.test.js`:

```javascript
const { createSlackClient, validateToken, setPresence, setStatus } = require('./slack');

describe('slack', () => {
  test('createSlackClient returns client with token', () => {
    const client = createSlackClient('xoxp-test-token');
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  test('validateToken calls auth.test', async () => {
    const mockClient = {
      auth: {
        test: jest.fn().mockResolvedValue({ ok: true, user: 'testuser' })
      }
    };
    const result = await validateToken(mockClient);
    expect(mockClient.auth.test).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, user: 'testuser' });
  });

  test('setPresence calls users.setPresence', async () => {
    const mockClient = {
      users: {
        setPresence: jest.fn().mockResolvedValue({ ok: true })
      }
    };
    await setPresence(mockClient);
    expect(mockClient.users.setPresence).toHaveBeenCalledWith({ presence: 'auto' });
  });

  test('setStatus calls users.profile.set', async () => {
    const mockClient = {
      users: {
        profile: {
          set: jest.fn().mockResolvedValue({ ok: true })
        }
      }
    };
    await setStatus(mockClient, ':coffee:', 'Break time');
    expect(mockClient.users.profile.set).toHaveBeenCalledWith({
      profile: {
        status_emoji: ':coffee:',
        status_text: 'Break time'
      }
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - Cannot find module './slack'

**Step 3: Write Slack module implementation**

Create `src/slack.js`:

```javascript
const { WebClient } = require('@slack/web-api');

function createSlackClient(token) {
  return new WebClient(token);
}

async function validateToken(client) {
  return await client.auth.test();
}

async function setPresence(client) {
  return await client.users.setPresence({ presence: 'auto' });
}

async function setStatus(client, emoji, text) {
  return await client.users.profile.set({
    profile: {
      status_emoji: emoji,
      status_text: text
    }
  });
}

async function clearStatus(client) {
  return await setStatus(client, '', '');
}

module.exports = {
  createSlackClient,
  validateToken,
  setPresence,
  setStatus,
  clearStatus
};
```

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/slack.js src/slack.test.js
git commit -m "feat: add Slack API wrapper module"
```

---

## Task 4: Scheduler Module

**Files:**
- Create: `src/scheduler.js`
- Create: `src/scheduler.test.js`

**Step 1: Write failing test for scheduler logic**

Create `src/scheduler.test.js`:

```javascript
const {
  isWorkDay,
  isWithinWorkHours,
  getCurrentStatus,
  parseTime
} = require('./scheduler');

describe('scheduler', () => {
  describe('parseTime', () => {
    test('parses HH:MM to minutes since midnight', () => {
      expect(parseTime('09:00')).toBe(540);
      expect(parseTime('18:00')).toBe(1080);
      expect(parseTime('11:30')).toBe(690);
    });
  });

  describe('isWorkDay', () => {
    test('returns true for Monday-Friday', () => {
      expect(isWorkDay(new Date('2025-02-03'))).toBe(true); // Monday
      expect(isWorkDay(new Date('2025-02-07'))).toBe(true); // Friday
    });

    test('returns false for Saturday-Sunday', () => {
      expect(isWorkDay(new Date('2025-02-08'))).toBe(false); // Saturday
      expect(isWorkDay(new Date('2025-02-09'))).toBe(false); // Sunday
    });
  });

  describe('isWithinWorkHours', () => {
    const workHours = { start: '09:00', end: '18:00' };

    test('returns true during work hours', () => {
      const date = new Date('2025-02-03T10:00:00');
      expect(isWithinWorkHours(date, workHours)).toBe(true);
    });

    test('returns false before work hours', () => {
      const date = new Date('2025-02-03T08:00:00');
      expect(isWithinWorkHours(date, workHours)).toBe(false);
    });

    test('returns false after work hours', () => {
      const date = new Date('2025-02-03T19:00:00');
      expect(isWithinWorkHours(date, workHours)).toBe(false);
    });
  });

  describe('getCurrentStatus', () => {
    const config = {
      defaultStatus: { emoji: ':green_circle:', text: 'Available' },
      statusOverrides: [
        { start: '11:30', end: '12:30', emoji: ':bento:', text: 'Lunch' },
        { start: '14:00', end: '15:00', emoji: ':headphones:', text: 'Focus' }
      ]
    };

    test('returns default status outside override windows', () => {
      const date = new Date('2025-02-03T10:00:00');
      expect(getCurrentStatus(date, config)).toEqual({
        emoji: ':green_circle:',
        text: 'Available'
      });
    });

    test('returns override status during override window', () => {
      const date = new Date('2025-02-03T12:00:00');
      expect(getCurrentStatus(date, config)).toEqual({
        emoji: ':bento:',
        text: 'Lunch'
      });
    });

    test('returns second override during its window', () => {
      const date = new Date('2025-02-03T14:30:00');
      expect(getCurrentStatus(date, config)).toEqual({
        emoji: ':headphones:',
        text: 'Focus'
      });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - Cannot find module './scheduler'

**Step 3: Write scheduler module implementation**

Create `src/scheduler.js`:

```javascript
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function getMinutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function isWorkDay(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

function isWithinWorkHours(date, workHours) {
  const currentMinutes = getMinutesSinceMidnight(date);
  const startMinutes = parseTime(workHours.start);
  const endMinutes = parseTime(workHours.end);
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function getCurrentStatus(date, config) {
  const currentMinutes = getMinutesSinceMidnight(date);

  for (const override of config.statusOverrides) {
    const startMinutes = parseTime(override.start);
    const endMinutes = parseTime(override.end);
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return { emoji: override.emoji, text: override.text };
    }
  }

  return {
    emoji: config.defaultStatus.emoji,
    text: config.defaultStatus.text
  };
}

function shouldBeActive(date, config) {
  return isWorkDay(date) && isWithinWorkHours(date, config.workHours);
}

module.exports = {
  parseTime,
  isWorkDay,
  isWithinWorkHours,
  getCurrentStatus,
  shouldBeActive
};
```

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/scheduler.js src/scheduler.test.js
git commit -m "feat: add scheduler module for time-based logic"
```

---

## Task 5: Init Command

**Files:**
- Modify: `bin/slackgreen.js`

**Step 1: Add init command to CLI**

Update `bin/slackgreen.js`:

```javascript
#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const readline = require('readline');
const { DEFAULT_CONFIG, getConfigPath, getConfigDir, saveConfig } = require('../src/config');

program
  .name('slackgreen')
  .description('Keep Slack status green and manage scheduled status changes')
  .version('1.0.0');

program
  .command('init')
  .description('Create config file with default settings')
  .action(async () => {
    const configPath = getConfigPath();

    if (fs.existsSync(configPath)) {
      console.log(`Config already exists at ${configPath}`);
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

    console.log('\nSlackGreen Setup\n');
    console.log('You need a Slack user token with these scopes:');
    console.log('  - users:write');
    console.log('  - users.profile:write\n');
    console.log('Create a Slack app at https://api.slack.com/apps\n');

    const token = await question('Enter your Slack token (xoxp-...): ');
    rl.close();

    const config = { ...DEFAULT_CONFIG, slackToken: token || DEFAULT_CONFIG.slackToken };
    saveConfig(config);

    console.log(`\nConfig saved to ${configPath}`);
    console.log('Edit this file to customize your schedule.');
    console.log('Run "slackgreen start" to begin.');
  });

program.parse();
```

**Step 2: Test init command manually**

Run: `node bin/slackgreen.js init`
Expected: Prompts for token, creates config file

**Step 3: Commit**

```bash
git add bin/slackgreen.js
git commit -m "feat: add init command for config setup"
```

---

## Task 6: Start Command (Foreground)

**Files:**
- Modify: `bin/slackgreen.js`
- Create: `src/runner.js`

**Step 1: Create runner module**

Create `src/runner.js`:

```javascript
const { createSlackClient, validateToken, setPresence, setStatus } = require('./slack');
const { shouldBeActive, getCurrentStatus } = require('./scheduler');
const { loadConfig } = require('./config');

let lastStatus = null;

async function tick(client, config) {
  const now = new Date();

  if (!shouldBeActive(now, config)) {
    console.log(`[${now.toLocaleTimeString()}] Outside work hours, waiting...`);
    return;
  }

  // Set presence
  try {
    await setPresence(client);
    console.log(`[${now.toLocaleTimeString()}] Presence ping sent`);
  } catch (err) {
    console.error(`[${now.toLocaleTimeString()}] Presence error:`, err.message);
  }

  // Check and update status
  const status = getCurrentStatus(now, config);
  const statusKey = `${status.emoji}:${status.text}`;

  if (statusKey !== lastStatus) {
    try {
      await setStatus(client, status.emoji, status.text);
      console.log(`[${now.toLocaleTimeString()}] Status set: ${status.emoji} ${status.text}`);
      lastStatus = statusKey;
    } catch (err) {
      console.error(`[${now.toLocaleTimeString()}] Status error:`, err.message);
    }
  }
}

async function run(configPath) {
  const config = loadConfig(configPath);
  const client = createSlackClient(config.slackToken);

  // Validate token
  console.log('Validating Slack token...');
  try {
    const auth = await validateToken(client);
    console.log(`Authenticated as ${auth.user}`);
  } catch (err) {
    console.error('Invalid token:', err.message);
    process.exit(1);
  }

  console.log('Starting SlackGreen...');
  console.log(`Work hours: ${config.workHours.start} - ${config.workHours.end}`);
  console.log(`Presence ping interval: ${config.presencePingInterval} minutes`);
  console.log('Press Ctrl+C to stop.\n');

  // Initial tick
  await tick(client, config);

  // Schedule regular ticks
  const intervalMs = config.presencePingInterval * 60 * 1000;
  setInterval(() => tick(client, config), intervalMs);
}

module.exports = { run, tick };
```

**Step 2: Add start command to CLI**

Add to `bin/slackgreen.js` before `program.parse()`:

```javascript
const { run } = require('../src/runner');

program
  .command('start')
  .description('Start SlackGreen')
  .option('-d, --daemon', 'Run in background')
  .action(async (options) => {
    if (options.daemon) {
      console.log('Daemon mode not yet implemented. Run without --daemon for now.');
      return;
    }

    try {
      await run();
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });
```

**Step 3: Test start command**

Run: `node bin/slackgreen.js start`
Expected: Validates token (will fail if token is placeholder), runs tick loop

**Step 4: Commit**

```bash
git add bin/slackgreen.js src/runner.js
git commit -m "feat: add start command for foreground execution"
```

---

## Task 7: Status Command

**Files:**
- Modify: `bin/slackgreen.js`

**Step 1: Add status command**

Add to `bin/slackgreen.js` before `program.parse()`:

```javascript
const { loadConfig, getConfigPath } = require('../src/config');
const { shouldBeActive, getCurrentStatus } = require('../src/scheduler');

program
  .command('status')
  .description('Show current SlackGreen status')
  .action(() => {
    try {
      const config = loadConfig();
      const now = new Date();
      const active = shouldBeActive(now, config);
      const status = getCurrentStatus(now, config);

      console.log('\nSlackGreen Status\n');
      console.log(`Current time: ${now.toLocaleString()}`);
      console.log(`Work hours: ${config.workHours.start} - ${config.workHours.end}`);
      console.log(`Active: ${active ? 'Yes' : 'No (outside work hours or weekend)'}`);
      console.log(`Current status: ${status.emoji} ${status.text}`);
      console.log(`Config: ${getConfigPath()}`);
    } catch (err) {
      console.error('Error:', err.message);
    }
  });
```

**Step 2: Test status command**

Run: `node bin/slackgreen.js status`
Expected: Shows current status info

**Step 3: Commit**

```bash
git add bin/slackgreen.js
git commit -m "feat: add status command to show current state"
```

---

## Task 8: Set Command

**Files:**
- Modify: `bin/slackgreen.js`

**Step 1: Add set command**

Add to `bin/slackgreen.js` before `program.parse()`:

```javascript
const { createSlackClient, setStatus: slackSetStatus, validateToken } = require('../src/slack');

program
  .command('set')
  .description('Manually set Slack status')
  .requiredOption('-e, --emoji <emoji>', 'Status emoji (e.g., :coffee:)')
  .requiredOption('-t, --text <text>', 'Status text')
  .action(async (options) => {
    try {
      const config = loadConfig();
      const client = createSlackClient(config.slackToken);

      console.log('Validating token...');
      await validateToken(client);

      await slackSetStatus(client, options.emoji, options.text);
      console.log(`Status set: ${options.emoji} ${options.text}`);
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });
```

**Step 2: Test set command**

Run: `node bin/slackgreen.js set --emoji ":coffee:" --text "Testing"`
Expected: Sets status (requires valid token)

**Step 3: Commit**

```bash
git add bin/slackgreen.js
git commit -m "feat: add set command for manual status override"
```

---

## Task 9: Daemon Mode

**Files:**
- Create: `src/daemon.js`
- Modify: `bin/slackgreen.js`

**Step 1: Create daemon module**

Create `src/daemon.js`:

```javascript
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PID_FILE = path.join(os.homedir(), '.slackgreen', 'slackgreen.pid');
const LOG_FILE = path.join(os.homedir(), '.slackgreen', 'slackgreen.log');

function getPid() {
  if (fs.existsSync(PID_FILE)) {
    return parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
  }
  return null;
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function startDaemon() {
  const existingPid = getPid();
  if (existingPid && isRunning(existingPid)) {
    console.log(`SlackGreen already running (PID: ${existingPid})`);
    return;
  }

  const logStream = fs.openSync(LOG_FILE, 'a');
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'bin', 'slackgreen.js'), 'start'], {
    detached: true,
    stdio: ['ignore', logStream, logStream]
  });

  fs.writeFileSync(PID_FILE, String(child.pid));
  child.unref();

  console.log(`SlackGreen started in background (PID: ${child.pid})`);
  console.log(`Logs: ${LOG_FILE}`);
}

function stopDaemon() {
  const pid = getPid();
  if (!pid) {
    console.log('SlackGreen is not running');
    return;
  }

  if (!isRunning(pid)) {
    console.log('SlackGreen is not running (stale PID file)');
    fs.unlinkSync(PID_FILE);
    return;
  }

  process.kill(pid, 'SIGTERM');
  fs.unlinkSync(PID_FILE);
  console.log(`SlackGreen stopped (PID: ${pid})`);
}

function daemonStatus() {
  const pid = getPid();
  if (pid && isRunning(pid)) {
    return { running: true, pid };
  }
  return { running: false, pid: null };
}

module.exports = { startDaemon, stopDaemon, daemonStatus, PID_FILE, LOG_FILE };
```

**Step 2: Update start command for daemon mode**

Replace the start command action in `bin/slackgreen.js`:

```javascript
const { startDaemon } = require('../src/daemon');

program
  .command('start')
  .description('Start SlackGreen')
  .option('-d, --daemon', 'Run in background')
  .action(async (options) => {
    if (options.daemon) {
      startDaemon();
      return;
    }

    try {
      await run();
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });
```

**Step 3: Add stop command**

Add to `bin/slackgreen.js`:

```javascript
const { stopDaemon, daemonStatus, LOG_FILE } = require('../src/daemon');

program
  .command('stop')
  .description('Stop SlackGreen daemon')
  .action(() => {
    stopDaemon();
  });
```

**Step 4: Update status command to show daemon info**

Update status command to include:

```javascript
const { daemonStatus, LOG_FILE } = require('../src/daemon');

// Inside status action, add:
const daemon = daemonStatus();
console.log(`Daemon: ${daemon.running ? `Running (PID: ${daemon.pid})` : 'Not running'}`);
if (daemon.running) {
  console.log(`Logs: ${LOG_FILE}`);
}
```

**Step 5: Test daemon mode**

Run: `node bin/slackgreen.js start --daemon`
Run: `node bin/slackgreen.js status`
Run: `node bin/slackgreen.js stop`

**Step 6: Commit**

```bash
git add src/daemon.js bin/slackgreen.js
git commit -m "feat: add daemon mode for background execution"
```

---

## Task 10: Final Integration & README

**Files:**
- Create: `README.md`
- Modify: `package.json`

**Step 1: Create README**

Create `README.md`:

```markdown
# SlackGreen

Keep your Slack status green during work hours and manage scheduled status changes.

## Installation

```bash
npm install -g .
```

## Setup

1. Create a Slack app at https://api.slack.com/apps
2. Add these OAuth scopes: `users:write`, `users.profile:write`
3. Install the app to your workspace and copy the User OAuth Token

```bash
slackgreen init
```

## Usage

```bash
# Start in foreground (for testing)
slackgreen start

# Start in background
slackgreen start --daemon

# Stop background process
slackgreen stop

# Check status
slackgreen status

# Manually set status
slackgreen set --emoji ":coffee:" --text "Break"
```

## Configuration

Config file: `~/.slackgreen/config.json`

```json
{
  "slackToken": "xoxp-your-token",
  "workHours": {
    "start": "09:00",
    "end": "18:00"
  },
  "presencePingInterval": 5,
  "defaultStatus": {
    "emoji": ":large_green_circle:",
    "text": "Available"
  },
  "statusOverrides": [
    {
      "start": "11:30",
      "end": "12:30",
      "emoji": ":bento:",
      "text": "Lunch"
    }
  ]
}
```

## License

MIT
```

**Step 2: Update package.json**

Ensure package.json has:
```json
{
  "name": "slackgreen",
  "version": "1.0.0",
  "description": "Keep Slack status green and manage scheduled status changes",
  "main": "bin/slackgreen.js",
  "bin": {
    "slackgreen": "./bin/slackgreen.js"
  },
  "scripts": {
    "test": "jest"
  }
}
```

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Test full flow**

Run: `node bin/slackgreen.js --help`
Run: `node bin/slackgreen.js init`
Run: `node bin/slackgreen.js status`

**Step 5: Commit**

```bash
git add README.md package.json
git commit -m "docs: add README and finalize package.json"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Project setup | package.json, bin/slackgreen.js, .gitignore |
| 2 | Config module | src/config.js, src/config.test.js |
| 3 | Slack API module | src/slack.js, src/slack.test.js |
| 4 | Scheduler module | src/scheduler.js, src/scheduler.test.js |
| 5 | Init command | bin/slackgreen.js |
| 6 | Start command | bin/slackgreen.js, src/runner.js |
| 7 | Status command | bin/slackgreen.js |
| 8 | Set command | bin/slackgreen.js |
| 9 | Daemon mode | src/daemon.js, bin/slackgreen.js |
| 10 | README & finalize | README.md, package.json |
