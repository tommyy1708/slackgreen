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
