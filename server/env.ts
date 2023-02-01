function get<T>(name: string, transform: (env: string) => T) {
  const env = Deno.env.get(name);
  if (env === undefined) {
    throw new Error(`$${name} is not set`);
  }
  return transform(env);
}
const id = (env: string) => env;
const url = (env: string) => new URL(env);

export const ADMIN_KEY = get("ADMIN_KEY", id);
export const DEV_GUILD = get("DEV_GUILD", BigInt);
export const DISCORD_BOT_INVITE = get("DISCORD_BOT_INVITE", url);
export const DISCORD_TOKEN = get("DISCORD_TOKEN", id);
export const HOST = get("HOST", url);
