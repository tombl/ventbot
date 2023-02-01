import {
  hasListeners,
  notifySubscribers,
} from "@/routes/channels/[channel].tsx";
import { memo } from "@/utils/memo.ts";
import * as discord from "discordeno";
import * as log from "std/log/mod.ts";
import { DISCORD_TOKEN } from "./env.ts";
import { handleInteraction } from "./interactions.ts";

export const bot = discord.createBot({
  token: DISCORD_TOKEN,
  intents: discord.Intents.GuildMessages | discord.Intents.MessageContent |
    discord.Intents.GuildMessageReactions,
  events: {
    debug(...args) {
      log.debug(...args);
    },
    ready(_bot, { user }) {
      log.info(
        `attached to discord gateway as ${user.username}#${user.discriminator}`,
      );
    },
    interactionCreate(_bot, interaction) {
      log.debug("interaction", interaction.user.username);
      handleInteraction(interaction);
    },
    async messageCreate(_bot, message) {
      if (hasListeners(message.channelId)) {
        log.debug("message", message.tag, message.content);
        getMessage.insert(
          [message.id, message.channelId],
          Promise.resolve(message),
        );
        (await getLastMessages.read(message.channelId))?.push(message.id);
        notifySubscribers({ type: "create", message }, message.channelId);
      }
    },
    messageUpdate(_bot, message) {
      if (hasListeners(message.channelId)) {
        getMessage.insert(
          [message.id, message.channelId],
          Promise.resolve(message),
        );
        notifySubscribers({ type: "update", message }, message.channelId);
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
      notifySubscribers({
        type: "delete",
        id: message.id.toString(),
      }, message.channelId);
    },
    messageDeleteBulk(_bot, { channelId, ids }) {
      for (const id of ids) {
        getMessage.invalidate(id, channelId);
      }
      getLastMessages.invalidate(channelId);
      notifySubscribers(
        { type: "bulkDelete", ids: ids.map(String) },
        channelId,
      );
    },
    async reactionAdd(_bot, { messageId, channelId }) {
      log.debug("reaction", messageId, channelId);
      getMessage.invalidate(messageId, channelId);
      if (!hasListeners(channelId)) return;
      notifySubscribers({
        type: "update",
        message: await getMessage(messageId, channelId),
      }, channelId);
    },
    async reactionRemove(_bot, { messageId, channelId }) {
      log.debug("reaction", messageId, channelId);
      getMessage.invalidate(messageId, channelId);
      if (!hasListeners(channelId)) return;
      notifySubscribers({
        type: "update",
        message: await getMessage(messageId, channelId),
      }, channelId);
    },
    async reactionRemoveAll(_bot, { messageId, channelId }) {
      log.debug("reaction", messageId, channelId);
      getMessage.invalidate(messageId, channelId);
      if (!hasListeners(channelId)) return;
      notifySubscribers({
        type: "update",
        message: await getMessage(messageId, channelId),
      }, channelId);
    },
    async reactionRemoveEmoji(_bot, { messageId, channelId }) {
      log.debug("reaction", messageId, channelId);
      getMessage.invalidate(messageId, channelId);
      if (!hasListeners(channelId)) return;
      notifySubscribers({
        type: "update",
        message: await getMessage(messageId, channelId),
      }, channelId);
    },
  },
});

export const getMessage = memo((id: bigint, channelId: bigint) => {
  log.debug("fetching message", id, "in", channelId);
  return discord.getMessage(bot, channelId, id);
});
export const getLastMessages = memo(async (channelId: bigint) => {
  log.debug("fetching last messages");
  const messages = await discord.getMessages(bot, channelId, { limit: 10 });
  return messages.map((msg) => {
    getMessage.insert([msg.id, channelId], Promise.resolve(msg));
    return msg.id;
  }).reverse();
});
export const getChannel = memo((id: bigint) => {
  log.debug("fetching channel", id);
  return discord.getChannel(bot, id);
});
export const getUser = memo((id: bigint) => {
  log.debug("fetching user", id);
  return discord.getUser(bot, id);
});
export const getGuild = memo((id: bigint) => {
  log.debug("fetching guild", id);
  return discord.getGuild(bot, id);
});
export const getWebhook = memo((id: bigint) => {
  log.debug("fetching webhook", id);
  return discord.getWebhook(bot, id);
});

await discord.startBot(bot);
