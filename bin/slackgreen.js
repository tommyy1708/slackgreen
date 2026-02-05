#!/usr/bin/env node

const { program } = require('commander');

program
  .name('slackgreen')
  .description('Keep Slack status green and manage scheduled status changes')
  .version('1.0.0');

program.parse();
