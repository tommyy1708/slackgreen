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
