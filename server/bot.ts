import {
  convertMessage,
  hasListeners,
  notifySubscribers,
} from "@/routes/channels/[channel].tsx";
import { memo } from "@/utils/memo.ts";
import * as discord from "discordeno";
import { handleInteraction } from "./interactions.ts";

export const bot = discord.createBot({
  token: Deno.env.get("DISCORD_TOKEN")!,
  intents: discord.Intents.GuildMessages | discord.Intents.MessageContent,
  events: {
    // debug(...args) {
    //   console.info(args.join(" "));
    // },
    ready(_bot, { user }) {
      console.log(
        `attached to discord gateway as ${user.username}#${user.discriminator}`,
      );
    },
    interactionCreate(_bot, interaction) {
      console.log("interaction", interaction.user.username);
      handleInteraction(interaction);
    },
    async messageCreate(_bot, message) {
      if (hasListeners(message.channelId)) {
        console.log("message", message.tag, message.content);
        getMessage.insert(
          [message.id, message.channelId],
          Promise.resolve(message),
        );
        (await getLastMessages.read(message.channelId))?.push(message.id);
        await notifySubscribers({
          type: "create",
          message: convertMessage(message),
        }, message.channelId);
      }
    },
    async messageUpdate(_bot, message) {
      if (hasListeners(message.channelId)) {
        getMessage.insert(
          [message.id, message.channelId],
          Promise.resolve(message),
        );
        await notifySubscribers({
          type: "update",
          message: convertMessage(message),
        }, message.channelId);
      }
    },
    async messageDelete(_bot, message) {
      getMessage.invalidate(message.id, message.channelId);
      const messages = await getLastMessages.read(message.channelId);
      if (messages) {
        const index = messages.indexOf(message.id);
        if (index !== -1) {
          messages.splice(index, 1);
        }
      }
      await notifySubscribers({
        type: "delete",
        id: message.id.toString(),
      }, message.channelId);
    },
    async messageDeleteBulk(_bot, { channelId, ids }) {
      for (const id of ids) {
        getMessage.invalidate(id, channelId);
      }
      await notifySubscribers({ type: "bulkDelete", ids:ids.map(String) }, channelId);
      getLastMessages.invalidate(channelId);
    },
    async reactionAdd(_bot, { messageId, channelId }) {
      getMessage.invalidate(messageId, channelId);
      await notifySubscribers({
        type: "update",
        message: convertMessage(await getMessage(messageId, channelId)),
      }, channelId);
    },
    async reactionRemove(_bot, { messageId, channelId }) {
      getMessage.invalidate(messageId, channelId);
      await notifySubscribers({
        type: "update",
        message: convertMessage(await getMessage(messageId, channelId)),
      }, channelId);
    },
    async reactionRemoveAll(_bot, { messageId, channelId }) {
      getMessage.invalidate(messageId, channelId);
      await notifySubscribers({
        type: "update",
        message: convertMessage(await getMessage(messageId, channelId)),
      }, channelId);
    },
    async reactionRemoveEmoji(_bot, { messageId, channelId }) {
      getMessage.invalidate(messageId, channelId);
      await notifySubscribers({
        type: "update",
        message: convertMessage(await getMessage(messageId, channelId)),
      }, channelId);
    },
  },
});

export const getMessage = memo((id: bigint, channelId: bigint) => {
  console.log("fetching message", id);
  return discord.getMessage(bot, id, channelId);
});
export const getLastMessages = memo(async (channelId: bigint) => {
  console.log("fetching last messages");
  const messages = await discord.getMessages(bot, channelId, { limit: 10 });
  return messages.map((msg) => {
    getMessage.insert([msg.id, channelId], Promise.resolve(msg));
    return msg.id;
  }).reverse();
});
export const getChannel = memo((id: bigint) => {
  console.log("fetching channel", id);
  return discord.getChannel(bot, id);
});
export const getUser = memo((id: bigint) => {
  console.log("fetching user", id);
  return discord.getUser(bot, id);
});
export const getGuild = memo((id: bigint) => {
  console.log("fetching guild", id);
  return discord.getGuild(bot, id);
});
export const getWebhook = memo((id: bigint) => {
  console.log("fetching webhook", id);
  return discord.getWebhook(bot, id);
});

// await discord.startBot(bot);
