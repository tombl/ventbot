function get<T>(name: string) {
  const env = Deno.env.get(name);
  if (env === undefined) {
    throw new Error(`$${name} is not set`);
  }
  return env;
}

export const ADMIN_KEY = get("ADMIN_KEY");
export const DEV_GUILD = BigInt(get("DEV_GUILD"));
export const DISCORD_CLIENT_ID = get("DISCORD_CLIENT_ID");
export const DISCORD_TOKEN = get("DISCORD_TOKEN");

const HOST = new URL(get("HOST"));
export function host(pathname: string) {
  return new URL(pathname, HOST);
}
