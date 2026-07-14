import { slackChannel } from "eve/channels/slack";
import { connectSlackCredentials } from "@vercel/connect/eve";

/**
 * Slack channel for the note agent.
 *
 * To set up:
 * 1. Install @vercel/connect: npm install @vercel/connect
 * 2. Create a Slack Connect client:
 *    vercel connect create slack --triggers
 *    vercel connect detach <uid> --yes
 *    vercel connect attach <uid> --triggers --trigger-path /eve/v1/slack --yes
 * 3. Update the credentials UID below
 */

export default slackChannel({
  credentials: connectSlackCredentials("slack/note-agent"),
  threadContext: { since: "last-agent-reply" },
});
