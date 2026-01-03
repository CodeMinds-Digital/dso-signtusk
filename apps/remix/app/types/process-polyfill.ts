/**
 * Browser polyfill for Node.js process object.
 * This provides a minimal process implementation for browser environments.
 * Must be imported before any code that uses process.
 */

const browserProcess = {
  env: {
    NODE_ENV: "production",
  },
  browser: true,
  version: "",
  versions: {},
  platform: "browser",
  cwd: () => "/",
  nextTick: (fn: () => void) => setTimeout(fn, 0),
};

// Install globally if not already defined
if (typeof globalThis !== "undefined") {
  const g = globalThis as unknown as { process?: typeof browserProcess };
  if (!g.process) {
    g.process = browserProcess;
  } else {
    // Merge env if process exists but env is incomplete
    g.process.env = { ...browserProcess.env, ...g.process.env };
  }
}

if (typeof window !== "undefined") {
  const w = window as unknown as { process?: typeof browserProcess };
  if (!w.process) {
    w.process = browserProcess;
  } else {
    w.process.env = { ...browserProcess.env, ...w.process.env };
  }
}

export { browserProcess };
export default browserProcess;
