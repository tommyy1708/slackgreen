# SlackGreen

Keep your Slack status green during work hours and manage scheduled status changes.

## Installation

### Option 1: Standalone Executable (No Node.js Required)

Download the pre-built executable for your platform from the [Releases](https://github.com/tommyy1708/slackgreen/releases) page:

- **macOS**: `slackgreen-macos`
- **Windows**: `slackgreen-win.exe`
- **Linux**: `slackgreen-linux`

Make it executable (macOS/Linux):
```bash
chmod +x slackgreen-macos
./slackgreen-macos init
```

On Windows, just run:
```cmd
slackgreen-win.exe init
```

### Option 2: Install via npm (Requires Node.js)

```bash
npm install -g .
```

Or clone and install:
```bash
git clone https://github.com/tommyy1708/slackgreen.git
cd slackgreen
npm install -g .
```

## Setup

1. Create a Slack app at https://api.slack.com/apps
2. Choose "From scratch", name it (e.g., "SlackGreen"), select your workspace
3. Go to **OAuth & Permissions** in the sidebar
4. Under **User Token Scopes**, add:
   - `users:write`
   - `users.profile:write`
5. Click **Install to Workspace** at the top
6. Copy the **User OAuth Token** (starts with `xoxp-`)

Then run:
```bash
slackgreen init
```

Paste your token when prompted.

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

### Configuration Options

| Option | Description |
|--------|-------------|
| `slackToken` | Your Slack User OAuth Token (xoxp-...) |
| `workHours.start` | Start of work day (24h format, e.g., "09:00") |
| `workHours.end` | End of work day (24h format, e.g., "18:00") |
| `presencePingInterval` | Minutes between presence pings (default: 5) |
| `defaultStatus.emoji` | Default status emoji during work hours |
| `defaultStatus.text` | Default status text during work hours |
| `statusOverrides` | Array of time-based status overrides |

## Building Standalone Executables

To build executables yourself (requires Node.js):

```bash
# Clone the repo
git clone https://github.com/tommyy1708/slackgreen.git
cd slackgreen
npm install

# Build for all platforms
npm run build

# Or build for specific platform
npm run build:macos
npm run build:win
npm run build:linux
```

Executables will be created in the `dist/` folder.

## License

MIT
