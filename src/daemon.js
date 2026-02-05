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
