import { BindValue, Database, Statement } from "sqlite3";
import { DatabaseMetrics, Registry } from "./metrics.ts";

export function trustedQuery(query: string) {
  const arr: string[] & { raw?: string[] } = [query];
  arr.raw = [query];
  return arr as TemplateStringsArray;
}

class WrappedDatabase {
  constructor(public db: Database) {}
  #cache = new WeakMap<TemplateStringsArray, Statement>();
  #getStatement(strings: TemplateStringsArray) {
    let stmt = this.#cache.get(strings);
    if (stmt === undefined) {
      stmt = this.db.prepare(strings.join("?"));
      this.#cache.set(strings, stmt);
    }
    return stmt;
  }

  run(strings: TemplateStringsArray, ...values: BindValue[]) {
    return this.#getStatement(strings).run(...values);
  }

  value<T extends unknown[]>(
    strings: TemplateStringsArray,
    ...values: BindValue[]
  ): T | undefined {
    return this.#getStatement(strings).value(...values);
  }
  values<T extends unknown[]>(
    strings: TemplateStringsArray,
    ...values: BindValue[]
  ): T[] {
    return this.#getStatement(strings).values(...values);
  }

  row<T>(
    strings: TemplateStringsArray,
    ...values: BindValue[]
  ) {
    return this.#getStatement(strings).get(...values) as T | undefined;
  }
  rows<T>(
    strings: TemplateStringsArray,
    ...values: BindValue[]
  ) {
    return this.#getStatement(strings).all(...values) as T[];
  }

  transaction<T>(fn: (arg: T) => void) {
    return this.db.transaction(fn);
  }
}

const db = new WrappedDatabase(
  new Database(new URL("../storage/db.sqlite", import.meta.url), {
    int64: true,
  }),
);

db.run`
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
`;

db.run`
create table if not exists authorisations (
  id integer primary key,
  token blob not null,
  expiry integer,
  useragent text,
  discord_user integer not null,
  discord_channel integer not null
) strict;`;

db.run`
create table if not exists webhooks (
  discord_channel integer primary key,
  id integer not null,
  token text not null
) strict;`;

db.run`
create table if not exists sent_messages (
  id integer primary key,
  authorisation integer,
  discord_message integer not null,
  hash blob not null,
  foreign key (authorisation) references authorisations (id)
) strict;`;

export interface Authorisation {
  id: bigint;
  token: Uint8Array;
  expiry: number | null;
  useragent: string | null;
  discord_user: bigint;
  discord_channel: bigint;
}
export interface Webhook {
  discord_channel: bigint;
  id: bigint;
  token: string;
}
export interface SentMessage {
  id: bigint;
  authorisation: bigint;
  discord_message: bigint;
  hash: Uint8Array;
}

export default db;

const metrics = new DatabaseMetrics();
metrics.tables.set(
  "authorisations",
  () => db.value<[number]>`select count(*) from authorisations`![0],
);
metrics.tables.set(
  "webhooks",
  () => db.value<[number]>`select count(*) from webhooks`![0],
);
metrics.tables.set(
  "sent_messages",
  () => db.value<[number]>`select count(*) from sent_messages`![0],
);

Registry.sources.push(metrics);
