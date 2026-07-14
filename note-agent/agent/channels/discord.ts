import { discordChannel } from "eve/channels/discord";

/**
 * Discord channel for the note agent.
 *
 * To set up:
 * 1. Create a Discord application at https://discord.com/developers/applications
 * 2. Set these env vars:
 *    DISCORD_PUBLIC_KEY=...   (from Discord Developer Portal)
 *    DISCORD_APPLICATION_ID=... (from Discord Developer Portal)
 *    DISCORD_BOT_TOKEN=...    (from Bot settings)
 * 3. Register a slash command:
 *    curl -X PUT "https://discord.com/api/v10/applications/$DISCORD_APPLICATION_ID/commands" \
 *      -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
 *      -H "Content-Type: application/json" \
 *      -d '[{"name":"ask","description":"Ask the note agent","type":1,
 *        "options":[{"name":"message","description":"What should the agent do?","type":3,"required":true}]}]'
 * 4. Set Interactions Endpoint URL to https://your-app.vercel.app/eve/v1/discord
 */

export default discordChannel();
