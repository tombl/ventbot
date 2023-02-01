import * as discord from "discordeno";
import { assert } from "@/utils/assert.ts";
import * as bot from "./bot.ts";
import { createAuthorisation, getHash } from "./internal.ts";
import * as base64 from "std/encoding/base64url.ts";

const DEV_GUILD = Deno.env.get("DEV_GUILD");
assert(DEV_GUILD !== undefined, "$DEV_GUILD is not set");

const HOST = Deno.env.get("HOST");
assert(HOST !== undefined, "$HOST is not set");

const commands: discord.UpsertApplicationCommands[] = [{
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
  (interaction: discord.Interaction) => void
> = {
  async ventbot(interaction) {
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

  async verify(interaction) {
    const message = interaction.data!.resolved!.messages!.first()!;

    const hash = getHash(message.id);
    const content = hash === null // TODO: swap for embed, link help page
      ? `this message was not sent via ventbot`
      : `hash: ${base64.encode(hash)}`;
    await discord.sendInteractionResponse(
      bot.bot,
      interaction.id,
      interaction.token,
      {
        type: discord.InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content,
          flags: discord.ApplicationCommandFlags.Ephemeral,
        },
      },
    );
  },
};

const actionHandlers: Record<
  string,
  // deno-lint-ignore no-explicit-any
  (interaction: discord.Interaction, ...args: any[]) => void
> = {
  async sendlink(interaction, channelId: string) {
    const token = createAuthorisation(interaction.user.id, BigInt(channelId));

    await discord.sendInteractionResponse(
      bot.bot,
      interaction.id,
      interaction.token,
      {
        type: discord.InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          flags: discord.ApplicationCommandFlags.Ephemeral,
          embeds: [{
            description:
              "click the button below to add this channel to your ventbot.\nthen, whenever you want to vent, just go to https://vent.tombl.dev",
          }],
          components: [{
            type: discord.MessageComponentTypes.ActionRow,
            components: [{
              type: discord.MessageComponentTypes.Button,
              style: discord.ButtonStyles.Link,
              label: "add to vent",
              url: `${HOST}/add/${base64.encode(token)}`,
            }],
          }],
        },
      },
    );
  },
};

export async function updateCommands(global: boolean) {
  await discord.upsertApplicationCommands(
    bot.bot,
    commands,
    global ? undefined : BigInt(DEV_GUILD!),
  );
}

export function handleInteraction(interaction: discord.Interaction) {
  switch (interaction.type) {
    case discord.InteractionTypes.Ping: {
      console.log("ping");
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
        handler(interaction);
      } else {
        console.warn(`No handler for command ${JSON.stringify(name)}`);
      }
      break;
    }
    case discord.InteractionTypes.ModalSubmit:
    case discord.InteractionTypes.MessageComponent: {
      const { customId } = interaction.data!;
      if (!customId) {
        console.warn("Interaction missing customId: ", interaction);
        return;
      }
      const colon = customId.indexOf(":");
      const handlerName = customId.slice(0, colon);
      const handlerArgs = JSON.parse(customId.slice(colon + 1));
      const handler = actionHandlers[handlerName];
      if (handler) {
        handler(interaction, ...handlerArgs);
      } else {
        console.warn(`No handler for action ${JSON.stringify(customId)}`);
      }
      break;
    }
    default:
      console.warn(
        "Unhandled interaction type: ",
        discord.InteractionTypes[interaction.type],
      );
  }
}
