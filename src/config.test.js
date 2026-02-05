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
