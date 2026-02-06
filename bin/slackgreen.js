#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { DEFAULT_CONFIG, getConfigPath, getConfigDir, saveConfig, loadConfig } = require('../src/config');

// Get the command name based on how the script is run
function getCommandName() {
  const scriptPath = process.argv[1];
  const basename = path.basename(scriptPath);
  // If running as standalone executable or via node
  if (basename.startsWith('slackgreen')) {
    return `./${basename}`;
  }
  return 'slackgreen';
}
const { shouldBeActive, getCurrentStatus } = require('../src/scheduler');
const { run } = require('../src/runner');
const { createSlackClient, setStatus: slackSetStatus, validateToken } = require('../src/slack');
const { startDaemon, stopDaemon, daemonStatus, LOG_FILE } = require('../src/daemon');

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
    console.log(`Run "${getCommandName()} start" to begin.`);
  });

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

program
  .command('status')
  .description('Show current SlackGreen status')
  .action(() => {
    try {
      const config = loadConfig();
      const now = new Date();
      const active = shouldBeActive(now, config);
      const status = getCurrentStatus(now, config);
      const daemon = daemonStatus();

      console.log('\nSlackGreen Status\n');
      console.log(`Current time: ${now.toLocaleString()}`);
      console.log(`Work hours: ${config.workHours.start} - ${config.workHours.end}`);
      console.log(`Active: ${active ? 'Yes' : 'No (outside work hours or weekend)'}`);
      console.log(`Current status: ${status.emoji} ${status.text}`);
      console.log(`Daemon: ${daemon.running ? `Running (PID: ${daemon.pid})` : 'Not running'}`);
      if (daemon.running) {
        console.log(`Logs: ${LOG_FILE}`);
      }
      console.log(`Config: ${getConfigPath()}`);
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

program
  .command('stop')
  .description('Stop SlackGreen daemon')
  .action(() => {
    stopDaemon();
  });

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

program.parse();
