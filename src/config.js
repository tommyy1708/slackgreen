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
