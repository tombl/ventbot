import { iconBigintToHash } from "discordeno";
import { getChannel, getUser } from "../bot.ts";

export async function getUserName(id: bigint) {
  try {
    const user = await getUser(id);
    return user.username;
  } catch (e) {
    console.warn(e);
  }
}

export async function getChannelName(id: bigint) {
  try {
    const channel = await getChannel(id);
    return channel.name;
  } catch (e) {
    console.warn(e);
  }
}

export async function getAvatarId(userId: bigint) {
  const user = await getUser(userId);
  return user.avatar === undefined ? undefined : iconBigintToHash(user.avatar);
}
