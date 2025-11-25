## Discord Bot - Foundation Galactic Frontier

NAP/PvP enforcement, administration, and member assistance.

A self-hosted Discord bot for Foundation: Galactic Frontier guilds.

This bot helps guilds automatically process battle report screenshots, detect NAP/PvP violations, and maintain a persistent log of all reports.

It uses:
- 📤 OCR via OpenAI to parse screenshots
- 📚 A local JSON data file for persistence
- 📋 Slash commands to report battles, configure PvP windows, and view summaries
- 🔐 Completely self-hosted — you own your OpenAI usage, data, and images

⸻

🚀 Features

✔️ /report

Upload a battle screenshot → bot extracts:
- Attacker/Defender
- Guild tags
- System
- UTC battle time
- Trade/Escort status
- Winner/Loser
- Battle type
- Fleet power

Officers can approve or dismiss.

⸻

✔️ /pvp-setup

Configure a PvP window:
- Start time (UTC)
- End time (UTC)
- Allowed systems list

Only users with officer roles can run this.

⸻

✔️ /pvp

Shows current PvP state:
- Whether window is active
- Time until start/end
- Allowed systems

⸻

✔️ /report-summary

Lists confirmed violations and provides a ZIP of all screenshots.

⸻

🛠️ Self-Hosting Setup

This bot is not a hosted service.
You must run it yourself on your machine, your server, or your Raspberry Pi.

This ensures:
- You control the OpenAI API key
- No one else uses your quota
- All images stay on your machine
- No external servers or ports required

⸻

⚙️ 1. Install Dependencies

Requires:
- Node.js 18+
- npm

git clone https://github.com/your-org/fgf-bot.git
cd fgf-bot
npm install

⸻

🔑 2. Create a .env File

Create a file named .env in the project root:

DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here
DISCORD_GUILD_ID=your_server_id_here

PVP_CHANNEL_ID=channel_id_for_reports
OFFICER_ROLE_IDS=role1,role2,role3

OPENAI_API_KEY=your_openai_key_here
OCR_MODEL=gpt-4o-mini

DATA_FILE_PATH=data.json

Where do I find these values?

DISCORD_TOKEN
1. https://discord.com/developers/applications
2. Create Application → Bot → Reset Token
3. Copy Bot Token into .env

DISCORD_CLIENT_ID
Developer Portal → Application → General Information → “Application ID”

DISCORD_GUILD_ID
In Discord:
Enable Developer Mode → Right-click your server → Copy Server ID

PVP_CHANNEL_ID
Right-click your PvP channel → Copy Channel ID

OFFICER_ROLE_IDS
Right-click each role → Copy Role ID
Comma-separated.

OPENAI_API_KEY
https://platform.openai.com/account/api-keys
Generate your own key — no one else can use it.

⸻

🧩 3. Register Commands

This creates /report, /pvp, /pvp-setup, and /report-summary.

Run:

npm run register

If you set DISCORD_GUILD_ID, commands appear instantly.
If not, global commands may take 1 hour to propagate.

⸻

▶️ 4. Start the Bot

npm run dev

You should see:

Logged in as YourBotName

If the bot is online in your server → the setup is complete.

⸻

🖼️ 5. Test a Report

In the PvP channel you configured:

/report screenshot: <upload your battle screenshot>

The bot responds:
- Attempts OCR on the image
- Displays parsed summary
- Adds Approve/Dismiss buttons

⸻

📦 6. Data Storage

All reports and PvP settings are stored locally at:

./data.json

You can back this up, archive it, or rotate it as needed.

Nothing leaves your server except:
- the screenshot, streamed directly to OpenAI for OCR
- (only using your key)

No data is ever sent to third parties or logged externally.

⸻

🛡️ Security & Privacy

- You must keep your .env file private
- Your bot token must never be shared
- Your OpenAI key is never sent to anyone else
- This bot sends Discord images only to OpenAI’s OCR endpoint
- No internet-exposed ports are required
- No remote server or webhook is involved
- Every guild hosts their own bot if they want one

⸻

🔧 Development

TypeScript project layout:

src/
  bot.ts
  index.ts
  config.ts
  registerCommands.ts
  commands/
  services/
  types.ts

Run tests locally with:

npm run dev

Build:

npm run build

Start:

npm start

⸻

🤝 Contributing

Pull requests welcome.
This project exists to help the FGF community automate fair-play enforcement while remaining fully self-hosted and private.

⸻

❓ Support

If you encounter issues:
- Open an issue on GitHub
- Provide logs from your console
- Provide your exact environment (.env with secrets removed)
