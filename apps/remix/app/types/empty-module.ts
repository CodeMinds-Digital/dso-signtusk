// Empty module stub for server-only packages in client builds
// This provides minimal exports to satisfy import statements

// pg stubs
export class Pool {
  constructor(_config?: unknown) {
    throw new Error("pg Pool cannot be used in the browser");
  }
}

export class Client {
  constructor(_config?: unknown) {
    throw new Error("pg Client cannot be used in the browser");
  }
}

export default {};
