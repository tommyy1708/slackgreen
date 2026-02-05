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
