/**
 * Browser polyfills for Node.js globals
 * This file should be imported before any other modules that might need these globals
 */

// CommonJS compatibility - must be first
if (typeof (globalThis as any).exports === "undefined") {
  (globalThis as any).exports = {};
}

if (typeof (globalThis as any).module === "undefined") {
  (globalThis as any).module = { exports: {} };
}

if (typeof (globalThis as any).require === "undefined") {
  (globalThis as any).require = function (id: string) {
    if (id === "buffer") return { Buffer: (globalThis as any).Buffer };
    if (id === "process") return (globalThis as any).process;
    return {};
  };
}

// Process polyfill
if (typeof (globalThis as any).process === "undefined") {
  const processPolyfill = {
    env: { NODE_ENV: "production" },
    browser: true,
    version: "",
    versions: {},
    platform: "browser",
    cwd: () => "/",
    nextTick: (fn: () => void) => setTimeout(fn, 0),
    stdout: { write: () => {} },
    stderr: { write: () => {} },
  };

  (globalThis as any).process = processPolyfill;
  (globalThis as any).global = globalThis;
}

// Buffer polyfill
if (typeof (globalThis as any).Buffer === "undefined") {
  class BufferPolyfill {
    private _arr: Uint8Array;
    public length: number;

    constructor(data?: any, encoding?: string) {
      if (typeof data === "number") {
        // Buffer(size)
        this._arr = new Uint8Array(data);
        this.length = data;
      } else if (typeof data === "string") {
        // Buffer(string, encoding)
        const enc = encoding || "utf8";
        if (enc === "base64") {
          const binaryString = atob(data);
          this._arr = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            this._arr[i] = binaryString.charCodeAt(i);
          }
        } else if (enc === "hex") {
          this._arr = new Uint8Array(data.length / 2);
          for (let i = 0; i < data.length; i += 2) {
            this._arr[i / 2] = parseInt(data.substr(i, 2), 16);
          }
        } else {
          // utf8 or other
          const encoder = new TextEncoder();
          this._arr = encoder.encode(data);
        }
        this.length = this._arr.length;
      } else if (data instanceof Uint8Array) {
        this._arr = new Uint8Array(data);
        this.length = data.length;
      } else if (Array.isArray(data)) {
        this._arr = new Uint8Array(data);
        this.length = data.length;
      } else {
        this._arr = new Uint8Array(0);
        this.length = 0;
      }
    }

    toString(encoding?: string, start?: number, end?: number): string {
      const enc = encoding || "utf8";
      const s = start || 0;
      const e = end || this.length;
      const slice = this._arr.slice(s, e);

      if (enc === "base64") {
        let binary = "";
        for (let i = 0; i < slice.length; i++) {
          binary += String.fromCharCode(slice[i]);
        }
        return btoa(binary);
      } else if (enc === "hex") {
        return Array.from(slice)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      } else {
        // utf8 or other
        const decoder = new TextDecoder();
        return decoder.decode(slice);
      }
    }

    slice(start?: number, end?: number): BufferPolyfill {
      const s = start || 0;
      const e = end || this.length;
      return new BufferPolyfill(this._arr.slice(s, e));
    }

    static from(data: any, encoding?: string): BufferPolyfill {
      return new BufferPolyfill(data, encoding);
    }

    static alloc(size: number, fill?: any): BufferPolyfill {
      const buf = new BufferPolyfill(size);
      if (fill !== undefined) {
        const fillValue = typeof fill === "string" ? fill.charCodeAt(0) : fill;
        buf._arr.fill(fillValue);
      }
      return buf;
    }

    static allocUnsafe(size: number): BufferPolyfill {
      return new BufferPolyfill(size);
    }

    static isBuffer(obj: any): boolean {
      return obj instanceof BufferPolyfill;
    }

    static concat(list: any[], totalLength?: number): BufferPolyfill {
      if (!Array.isArray(list)) return new BufferPolyfill(0);

      let length = totalLength;
      if (length === undefined) {
        length = list.reduce((acc, buf) => acc + (buf.length || 0), 0);
      }

      const result = new BufferPolyfill(length);
      let offset = 0;

      for (const buf of list) {
        if (buf instanceof BufferPolyfill) {
          result._arr.set(buf._arr, offset);
          offset += buf.length;
        } else if (buf instanceof Uint8Array) {
          result._arr.set(buf, offset);
          offset += buf.length;
        }
        if (offset >= (length || 0)) break;
      }

      return result;
    }
  }

  // Set up Buffer globally
  (globalThis as any).Buffer = BufferPolyfill;
}

export {};
