import * as discord from "discordeno";
import * as base64 from "std/encoding/base64url.ts";
import * as bot from "./bot.ts";
import { DEV_GUILD, host } from "./env.ts";
import { createAuthorisation, getHash } from "./internal.ts";
import * as log from "std/log/mod.ts";

const commands: discord.CreateApplicationCommand[] = [{
  type: discord.ApplicationCommandTypes.ChatInput,
  name: "ventbot",
  description: "create a ventbot in this channel",
}, {
  type: discord.ApplicationCommandTypes.Message,
  name: "verify",
  description: "get the ventbot id of this message",
}];

const commandHandlers: Record<
  string,
  (interaction: discord.Interaction) => Promise<void>
> = {
  async ventbot(interaction) {
    await discord.sendInteractionResponse(
      bot.bot,
      interaction.id,
      interaction.token,
      {
        type: discord.InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          flags: discord.ApplicationCommandFlags.Ephemeral,
          embeds: [{
            title: "create a new ventbot?",
            fields: [
              {
                name: "trying to create a new ventbot?",
                value:
                  "you're in the right place. click confirm to create a vent button in this channel. you should probably pin the created button.",
              },
              {
                name: "trying to anonymously vent?",
                value:
                  "ignore this message. instead, find the vent button in this channel and click it. it's probably pinned.",
              },
            ],
          }],
          components: [{
            type: discord.MessageComponentTypes.ActionRow,
            components: [{
              type: discord.MessageComponentTypes.Button,
              style: discord.ButtonStyles.Primary,
              label: "confirm",
              customId: "confirmCreate:[]",
            }],
          }],
        },
      },
    );
  },

  async verify(interaction) {
    const message = interaction.data!.resolved!.messages!.first()!;

    const hash = getHash(message.id);
    await discord.sendInteractionResponse(
      bot.bot,
      interaction.id,
      interaction.token,
      {
        type: discord.InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          embeds: [{
            title: "message verification",
            description: hash === null
              ? "this message was not sent via ventbot"
              : undefined,
            fields: hash === null ? undefined : [{
              name: "hash",
              value: base64.encode(hash),
            }, {
              name: "what does this mean?",
              value: `check out ${host("/help/verification")}`,
            }],
          }],
          flags: discord.ApplicationCommandFlags.Ephemeral,
        },
      },
    );
  },
};

const actionHandlers: Record<
  string,
  // deno-lint-ignore no-explicit-any
  (interaction: discord.Interaction, ...args: any[]) => Promise<void>
> = {
  async sendlink(interaction, channelId: string) {
    const dm = await discord.getDmChannel(bot.bot, interaction.user.id);

    const token = createAuthorisation(interaction.user.id, BigInt(channelId));

    const msg = await discord.sendMessage(
      bot.bot,
      dm.id,
      {
        embeds: [{
          description:
            `click the button below to add this channel to your ventbot.
then, whenever you want to vent, just go to ${host("/").href}.
(that means you don't need to click this button again on this device)`,
        }],
        components: [{
          type: discord.MessageComponentTypes.ActionRow,
          components: [{
            type: discord.MessageComponentTypes.Button,
            style: discord.ButtonStyles.Link,
            label: "add to vent",
            url: host(`/add/${base64.encode(token)}`).href,
          }],
        }],
      },
    );

    setTimeout(() => {
      discord.deleteMessage(bot.bot, dm.id, msg.id);
    }, 1000 * 60 * 5);

    await discord.sendInteractionResponse(
      bot.bot,
      interaction.id,
      interaction.token,
      { type: discord.InteractionResponseTypes.DeferredUpdateMessage },
    );
  },

  async confirmCreate(interaction) {
    await discord.sendInteractionResponse(
      bot.bot,
      interaction.id,
      interaction.token,
      {
        type: discord.InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          components: [{
            type: discord.MessageComponentTypes.ActionRow,
            components: [{
              type: discord.MessageComponentTypes.Button,
              style: discord.ButtonStyles.Primary,
              label: "vent",
              customId: `sendlink:${
                JSON.stringify([interaction.channelId!.toString()])
              }`,
            }],
          }],
        },
      },
    );
  },
};

export async function updateCommands(global: boolean) {
  log.info(`updating ${global ? "global" : "guild"} commands`);
  if (global) {
    await discord.upsertGlobalApplicationCommands(bot.bot, commands);
  } else {
    await discord.upsertGuildApplicationCommands(bot.bot, DEV_GUILD, commands);
  }
}

export async function handleInteraction(interaction: discord.Interaction) {
  switch (interaction.type) {
    case discord.InteractionTypes.Ping: {
      discord.sendInteractionResponse(
        bot.bot,
        interaction.id,
        interaction.token,
        { type: discord.InteractionResponseTypes.Pong },
      );
      break;
    }
    case discord.InteractionTypes.ApplicationCommand: {
      const { name } = interaction.data!;
      const handler = commandHandlers[name];
      if (handler) {
        await handler(interaction);
      } else {
        log.warning(`No handler for command ${JSON.stringify(name)}`);
      }
      break;
    }
    case discord.InteractionTypes.ModalSubmit:
    case discord.InteractionTypes.MessageComponent: {
      const { customId } = interaction.data!;
      if (!customId) {
        log.warning("Interaction missing customId: ", interaction);
        return;
      }
      const colon = customId.indexOf(":");
      const handlerName = customId.slice(0, colon);
      const handlerArgs = JSON.parse(customId.slice(colon + 1));
      const handler = actionHandlers[handlerName];
      if (handler) {
        await handler(interaction, ...handlerArgs);
      } else {
        log.warning(`No handler for action ${JSON.stringify(customId)}`);
      }
      break;
    }
    default:
      log.warning(
        "Unhandled interaction type: ",
        discord.InteractionTypes[interaction.type],
      );
  }
}
