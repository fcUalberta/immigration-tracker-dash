import app from "./app";
import { logger } from "./lib/logger";
import { refreshUSCISData } from "./uscis-fetcher";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Kick off USCIS data download in the background — non-blocking
  refreshUSCISData().catch((e) =>
    logger.error({ err: e }, "Initial USCIS data fetch failed")
  );

  // Refresh every 24 hours — USCIS publishes new quarters ~quarterly,
  // but daily polling ensures we pick up a new release within a day.
  const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    logger.info("[USCIS] Scheduled refresh starting…");
    refreshUSCISData().catch((e) =>
      logger.error({ err: e }, "Scheduled USCIS data refresh failed")
    );
  }, REFRESH_INTERVAL_MS);
});
