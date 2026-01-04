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

// Buffer polyfill with full write() support
if (typeof (globalThis as any).Buffer === "undefined") {
  class BufferPolyfill {
    public _arr: Uint8Array;
    public length: number;

    constructor(data?: any, encoding?: string) {
      if (typeof data === "number") {
        this._arr = new Uint8Array(data);
        this.length = data;
      } else if (typeof data === "string") {
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
            this._arr[i / 2] = parseInt(data.substring(i, i + 2), 16);
          }
        } else {
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

    /**
     * Write string to buffer at offset - THIS IS THE CRITICAL MISSING METHOD
     * that causes "this.buffer.write is not a function" errors
     */
    write(
      string: string,
      offset?: number | string,
      length?: number | string,
      encoding?: string
    ): number {
      // Handle overloaded signatures
      let actualOffset = 0;
      let actualLength = this.length;
      let actualEncoding = "utf8";

      if (typeof offset === "string") {
        actualEncoding = offset;
      } else if (typeof offset === "number") {
        actualOffset = offset;
        if (typeof length === "string") {
          actualEncoding = length;
        } else if (typeof length === "number") {
          actualLength = length;
          if (encoding) actualEncoding = encoding;
        }
      }

      let bytes: Uint8Array;
      if (actualEncoding === "base64") {
        const binaryString = atob(string);
        bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
      } else if (actualEncoding === "hex") {
        bytes = new Uint8Array(string.length / 2);
        for (let i = 0; i < string.length; i += 2) {
          bytes[i / 2] = parseInt(string.substring(i, i + 2), 16);
        }
      } else {
        const encoder = new TextEncoder();
        bytes = encoder.encode(string);
      }

      const bytesToWrite = Math.min(
        bytes.length,
        actualLength,
        this.length - actualOffset
      );
      for (let i = 0; i < bytesToWrite; i++) {
        this._arr[actualOffset + i] = bytes[i];
      }

      return bytesToWrite;
    }

    /**
     * Fill buffer with value
     */
    fill(value: number | string, offset?: number, end?: number): this {
      const fillValue = typeof value === "string" ? value.charCodeAt(0) : value;
      const start = offset || 0;
      const stop = end || this.length;
      for (let i = start; i < stop; i++) {
        this._arr[i] = fillValue;
      }
      return this;
    }

    /**
     * Copy from this buffer to target buffer
     */
    copy(
      target: BufferPolyfill,
      targetStart?: number,
      sourceStart?: number,
      sourceEnd?: number
    ): number {
      const tStart = targetStart || 0;
      const sStart = sourceStart || 0;
      const sEnd = sourceEnd || this.length;
      const bytesToCopy = Math.min(sEnd - sStart, target.length - tStart);

      for (let i = 0; i < bytesToCopy; i++) {
        target._arr[tStart + i] = this._arr[sStart + i];
      }

      return bytesToCopy;
    }

    /**
     * Read unsigned 8-bit integer
     */
    readUInt8(offset: number): number {
      return this._arr[offset];
    }

    /**
     * Write unsigned 8-bit integer
     */
    writeUInt8(value: number, offset: number): number {
      this._arr[offset] = value & 0xff;
      return offset + 1;
    }

    /**
     * Read unsigned 16-bit integer (big endian)
     */
    readUInt16BE(offset: number): number {
      return (this._arr[offset] << 8) | this._arr[offset + 1];
    }

    /**
     * Read unsigned 16-bit integer (little endian)
     */
    readUInt16LE(offset: number): number {
      return this._arr[offset] | (this._arr[offset + 1] << 8);
    }

    /**
     * Read unsigned 32-bit integer (big endian)
     */
    readUInt32BE(offset: number): number {
      return (
        (this._arr[offset] * 0x1000000 +
          ((this._arr[offset + 1] << 16) |
            (this._arr[offset + 2] << 8) |
            this._arr[offset + 3])) >>>
        0
      );
    }

    /**
     * Read unsigned 32-bit integer (little endian)
     */
    readUInt32LE(offset: number): number {
      return (
        (this._arr[offset] |
          (this._arr[offset + 1] << 8) |
          (this._arr[offset + 2] << 16) |
          (this._arr[offset + 3] << 24)) >>>
        0
      );
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
        const decoder = new TextDecoder();
        return decoder.decode(slice);
      }
    }

    slice(start?: number, end?: number): BufferPolyfill {
      const s = start || 0;
      const e = end || this.length;
      return new BufferPolyfill(this._arr.slice(s, e));
    }

    subarray(start?: number, end?: number): BufferPolyfill {
      return this.slice(start, end);
    }

    /**
     * Compare two buffers
     */
    compare(target: BufferPolyfill): number {
      const len = Math.min(this.length, target.length);
      for (let i = 0; i < len; i++) {
        if (this._arr[i] < target._arr[i]) return -1;
        if (this._arr[i] > target._arr[i]) return 1;
      }
      if (this.length < target.length) return -1;
      if (this.length > target.length) return 1;
      return 0;
    }

    /**
     * Check equality
     */
    equals(other: BufferPolyfill): boolean {
      if (this.length !== other.length) return false;
      for (let i = 0; i < this.length; i++) {
        if (this._arr[i] !== other._arr[i]) return false;
      }
      return true;
    }

    /**
     * Index access
     */
    [index: number]: number;

    static from(data: any, encoding?: string): BufferPolyfill {
      return new BufferPolyfill(data, encoding);
    }

    static alloc(size: number, fill?: any): BufferPolyfill {
      const buf = new BufferPolyfill(size);
      if (fill !== undefined) {
        buf.fill(fill);
      }
      return buf;
    }

    static allocUnsafe(size: number): BufferPolyfill {
      return new BufferPolyfill(size);
    }

    static allocUnsafeSlow(size: number): BufferPolyfill {
      return new BufferPolyfill(size);
    }

    static isBuffer(obj: any): boolean {
      return obj instanceof BufferPolyfill;
    }

    static isEncoding(encoding: string): boolean {
      return ["utf8", "utf-8", "hex", "base64", "ascii", "binary"].includes(
        encoding.toLowerCase()
      );
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

    static byteLength(string: string, encoding?: string): number {
      const enc = encoding || "utf8";
      if (enc === "base64") {
        const cleanString = string.replace(/=/g, "");
        return Math.floor((cleanString.length * 3) / 4);
      } else if (enc === "hex") {
        return string.length / 2;
      } else {
        const encoder = new TextEncoder();
        return encoder.encode(string).length;
      }
    }

    static compare(buf1: BufferPolyfill, buf2: BufferPolyfill): number {
      return buf1.compare(buf2);
    }
  }

  // Set up Buffer globally
  (globalThis as any).Buffer = BufferPolyfill;
}

export {};
