export const logger = {
  info(message: string, ...args: unknown[]) {
    console.log(`[INFO] ${message}`, ...args);
  },

  debug(message: string, ...args: unknown[]) {
    if (process.env.DEBUG_TESTS) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  warn(message: string, ...args: unknown[]) {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error(message: string, ...args: unknown[]) {
    console.error(`[ERROR] ${message}`, ...args);
  },
};
