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
