# SlackGreen Design

## Overview

SlackGreen is a Node.js CLI tool that runs in the background on your machine to:
1. Prevent Slack from showing you as "away" during work hours
2. Automatically change your status/emoji on a schedule

## Authentication

**Manual token input** - Users create their own Slack app and paste the token into config. Requires:
- `users:write` - Set presence
- `users.profile:write` - Set status

## Configuration

Config file location: `~/.slackgreen/config.json`

```json
{
  "slackToken": "xoxp-your-token-here",
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

### Config Fields

| Field | Type | Description |
|-------|------|-------------|
| `slackToken` | string | Slack user token (xoxp-...) |
| `workHours.start` | string | Work start time (HH:MM, 24h format) |
| `workHours.end` | string | Work end time (HH:MM, 24h format) |
| `presencePingInterval` | number | Minutes between presence pings (default: 5) |
| `defaultStatus.emoji` | string | Default emoji during work hours |
| `defaultStatus.text` | string | Default status text during work hours |
| `statusOverrides` | array | Time-based overrides for status |

### Schedule Behavior

- Runs Monday-Friday only
- Same schedule applies to all weekdays
- Default status applies during work hours
- Status overrides replace default during their time window
- Outside work hours: no changes made

## CLI Commands

```bash
# First-time setup - creates config file with prompts
slackgreen init

# Start running in foreground (for testing)
slackgreen start

# Run in background (daemon mode)
slackgreen start --daemon

# Stop the background process
slackgreen stop

# Check current status
slackgreen status

# Manually trigger a status change (for testing)
slackgreen set --emoji ":coffee:" --text "Break"
```

### How `slackgreen start` Works

1. Load config from `~/.slackgreen/config.json`
2. Validate token with `auth.test` API call
3. Check if current time is within work hours (Mon-Fri)
4. If yes: set presence to active, apply correct status based on schedule
5. Run loop: every minute check if status should change, every 5 min ping presence
6. Outside work hours or weekends: wait until next work period

## Project Structure

```
slackgreen/
├── package.json
├── bin/
│   └── slackgreen.js      # CLI entry point
├── src/
│   ├── config.js          # Load/save config file
│   ├── scheduler.js       # Time-based logic (work hours, status slots)
│   ├── slack.js           # Slack API calls (presence, status)
│   └── daemon.js          # Background process management
└── README.md
```

## Dependencies

- `@slack/web-api` - Official Slack SDK for API calls
- `commander` - CLI argument parsing
- `node-schedule` - Cron-like job scheduling
- `pm2` or simple pid file - For daemon mode (background process)

## Slack API Methods

| Method | Purpose |
|--------|---------|
| `auth.test` | Validate token on startup |
| `users.setPresence({ presence: 'auto' })` | Keep status active |
| `users.profile.set({ profile: { status_emoji, status_text } })` | Set status |

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid token | Show clear error on startup, exit |
| Network failure | Log warning, retry on next interval |
| Config file missing | Prompt to run `slackgreen init` |

## Edge Cases

| Case | Behavior |
|------|----------|
| Computer sleeps/wakes | On wake, check time and apply correct status |
| Time boundary crossing | Scheduler checks every minute, max 1 min delay |
| Manual status override | SlackGreen overwrites at next check (schedule wins) |

## Logging

- Logs written to `~/.slackgreen/logs/`
- `slackgreen status` shows: last ping time, current status, next scheduled change
