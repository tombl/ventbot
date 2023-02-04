import {
  MetricsSource,
  OpenMetric,
  runMetricsServer,
} from "observability/sinks/openmetrics/server.ts";

export { DefaultRegistry as Registry } from "observability/sinks/openmetrics/server.ts";

export class HttpSource implements MetricsSource {
  #counters = new Map<string, number>();
  #inFlight = 0;
  #within10ms = 0;
  #within100ms = 0;
  #within1000ms = 0;
  #served = 0;
  #totalTime = 0;

  feed(req: Request) {
    this.#inFlight++;
    const startTime = performance.now();

    return (resp: Response) => {
      const counterKey = `{code="${resp.status || 200}",method=${
        JSON.stringify(req.method.toLowerCase())
      }}`;

      const endTime = performance.now();

      const totalMillis = endTime - startTime;
      this.#inFlight--;
      this.#served++;
      this.#totalTime += totalMillis;
      if (totalMillis < 10) this.#within10ms++;
      if (totalMillis < 100) this.#within100ms++;
      if (totalMillis < 1000) this.#within1000ms++;

      const counter = this.#counters.get(counterKey) ?? 0;
      this.#counters.set(counterKey, counter + 1);
    };
  }

  *scrapeMetrics(): Generator<OpenMetric, void, unknown> {
    yield {
      prefix: "denohttp_handled_requests",
      type: "counter",
      help:
        `Number of HTTP requests that have been received and responded to in full.`,
      values: this.#counters,
    };

    yield {
      prefix: "denohttp_requests_in_flight",
      type: "gauge",
      help: `Current number of HTTP requests being served.`,
      singleValue: this.#inFlight,
    };

    yield {
      prefix: "denohttp_request_duration_seconds",
      type: "histogram",
      unit: "seconds",
      help:
        `A histogram of the HTTP request durations, including writing a response.`,
      values: new Map([
        ['_bucket{le="0.01"}', this.#within10ms],
        ['_bucket{le="0.1"}', this.#within100ms],
        ['_bucket{le="1"}', this.#within1000ms],
        ['_bucket{le="+Inf"}', this.#served],
        ["_sum", this.#totalTime / 1000],
        ["_count", this.#served],
      ]),
    };
  }
}

interface DiscordCache {
  size: number;
  hits: number;
  misses: number;
  invalidations: number;
  insertions: number;
  evictions: number;
}

export class DiscordMetrics implements MetricsSource {
  handledInteractions = 0;
  inflightInteractions = 0;
  caches = new Map<string, () => DiscordCache>();

  *scrapeMetrics(): Generator<OpenMetric, void, unknown> {
    yield {
      prefix: "discord_handled_interactions",
      type: "counter",
      help:
        `Number of interactions that have been received and responded to in full.`,
      singleValue: this.handledInteractions,
    };

    yield {
      prefix: "discord_inflight_interactions",
      type: "gauge",
      help: `Current number of interactions being served.`,
      singleValue: this.inflightInteractions,
    };

    yield {
      prefix: "discord_cache",
      type: "histogram",
      help: `Cache information`,
      values: new Map(
        [...this.caches.entries()].flatMap(([name, cache]) => {
          const { size, hits, misses, invalidations, insertions, evictions } =
            cache();
          return Object.entries({
            [`${name}_size`]: size,
            [`${name}_hits`]: hits,
            [`${name}_misses`]: misses,
            [`${name}_invalidations`]: invalidations,
            [`${name}_insertions`]: insertions,
            [`${name}_evictions`]: evictions,
          });
        }),
      ),
    };
  }
}

runMetricsServer({ port: 9090 });
