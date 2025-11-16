const LOG_PREFIX = "[Reverso]";
const IS_DEV = process.env.NODE_ENV !== "production";

const shouldLog = (level: "info" | "warn" | "error") => {
  if (level === "error") {
    return true;
  }
  return IS_DEV;
};

/**
 * Logs info-level messages when not in production.
 */
export function logInfo(...args: unknown[]) {
  if (shouldLog("info")) {
    console.info(LOG_PREFIX, ...args);
  }
}

/**
 * Logs warning-level messages when not in production.
 */
export function logWarn(...args: unknown[]) {
  if (shouldLog("warn")) {
    console.warn(LOG_PREFIX, ...args);
  }
}

/**
 * Logs error-level messages in all environments.
 */
export function logError(...args: unknown[]) {
  if (shouldLog("error")) {
    console.error(LOG_PREFIX, ...args);
  }
}
