# SlackGreen

Keep your Slack status green during work hours and manage scheduled status changes.

## Installation

### Option 1: Standalone Executable (No Node.js Required)

Download the pre-built executable for your platform from the [Releases](https://github.com/tommyy1708/slackgreen/releases) page:

| Platform | File |
|----------|------|
| macOS (Apple Silicon M1/M2/M3) | `slackgreen-macos-arm64` |
| macOS (Intel) | `slackgreen-macos-x64` |
| Windows | `slackgreen-win.exe` |
| Linux | `slackgreen-linux` |

**macOS/Linux:**
```bash
# Make executable
chmod +x slackgreen-macos-arm64

# Run setup
./slackgreen-macos-arm64 init
```

**Windows:**
```cmd
slackgreen-win.exe init
```

### Option 2: Install via npm (Requires Node.js)

```bash
git clone https://github.com/tommyy1708/slackgreen.git
cd slackgreen
npm install -g .
```

After npm install, you can use `slackgreen` directly:
```bash
slackgreen init
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

Then run init and paste your token when prompted:
```bash
# Standalone executable
./slackgreen-macos-arm64 init

# Or if installed via npm
slackgreen init
```

## Usage

Replace `./slackgreen-macos-arm64` with your executable name or `slackgreen` if installed via npm.

```bash
# Start in foreground (for testing)
./slackgreen-macos-arm64 start

# Start in background (daemon mode)
./slackgreen-macos-arm64 start --daemon

# Stop background process
./slackgreen-macos-arm64 stop

# Check status
./slackgreen-macos-arm64 status

# Manually set status
./slackgreen-macos-arm64 set --emoji ":coffee:" --text "Break"
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
    "emoji": "",
    "text": ""
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
git clone https://github.com/tommyy1708/slackgreen.git
cd slackgreen
npm install

# Build for all platforms
npm run build

# Or build for specific platform
npm run build:macos-arm64    # Apple Silicon
npm run build:macos-x64      # Intel Mac
npm run build:win            # Windows
npm run build:linux          # Linux
```

Executables will be created in the `dist/` folder.

## License

MIT
