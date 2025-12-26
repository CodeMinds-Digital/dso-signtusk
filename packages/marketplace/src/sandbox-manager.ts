/**
 * Sandbox Manager
 * 
 * Manages secure sandboxed execution environments for third-party apps
 * with resource limits, security isolation, and monitoring.
 */

import { VM } from 'vm2';
import Docker from 'dockerode';
import { SandboxEnvironment, SandboxLevel } from './types';

export class SandboxManager {
    private docker: Docker;
    private activeSandboxes: Map<string, SandboxEnvironment> = new Map();

    constructor() {
        this.docker = new Docker();
    }

    /**
     * Create a new sandbox environment
     */
    async createSandbox(
        installationId: string,
        config: {
            level: SandboxLevel;
            resources: {
                memory: number;
                cpu: number;
                storage: number;
                network: boolean;
            };
            timeouts: {
                execution: number;
                idle: number;
            };
        }
    ): Promise<SandboxEnvironment> {
        const sandboxId = this.generateSandboxId();

        let sandbox: SandboxEnvironment;

        switch (config.level) {
            case SandboxLevel.BASIC:
                sandbox = await this.createBasicSandbox(sandboxId, installationId, config);
                break;
            case SandboxLevel.STANDARD:
                sandbox = await this.createStandardSandbox(sandboxId, installationId, config);
                break;
            case SandboxLevel.STRICT:
                sandbox = await this.createStrictSandbox(sandboxId, installationId, config);
                break;
            case SandboxLevel.ISOLATED:
                sandbox = await this.createIsolatedSandbox(sandboxId, installationId, config);
                break;
            default:
                throw new Error(`Unsupported sandbox level: ${config.level}`);
        }

        this.activeSandboxes.set(sandboxId, sandbox);
        return sandbox;
    }

    /**
     * Execute code in a sandbox
     */
    async executeCode(sandboxId: string, code: string, context: any): Promise<any> {
        const sandbox = this.activeSandboxes.get(sandboxId);
        if (!sandbox) {
            throw new Error('Sandbox not found');
        }

        if (sandbox.status !== 'running') {
            throw new Error('Sandbox is not running');
        }

        try {
            // Update last activity
            sandbox.lastActivity = new Date();

            switch (sandbox.securityLevel) {
                case SandboxLevel.BASIC:
                    return await this.executeInBasicSandbox(sandbox, code, context);
                case SandboxLevel.STANDARD:
                    return await this.executeInStandardSandbox(sandbox, code, context);
                case SandboxLevel.STRICT:
                    return await this.executeInStrictSandbox(sandbox, code, context);
                case SandboxLevel.ISOLATED:
                    return await this.executeInIsolatedSandbox(sandbox, code, context);
                default:
                    throw new Error(`Unsupported sandbox level: ${sandbox.securityLevel}`);
            }
        } catch (error) {
            // Log execution error
            console.error('Sandbox execution error:', error);
            throw error;
        }
    }

    /**
     * Destroy a sandbox environment
     */
    async destroySandbox(sandboxId: string): Promise<void> {
        const sandbox = this.activeSandboxes.get(sandboxId);
        if (!sandbox) {
            return; // Already destroyed
        }

        try {
            // Stop container if it exists
            if (sandbox.containerId) {
                const container = this.docker.getContainer(sandbox.containerId);
                await container.stop();
                await container.remove();
            }

            // Update status
            sandbox.status = 'stopped';

            // Remove from active sandboxes
            this.activeSandboxes.delete(sandboxId);
        } catch (error) {
            console.error('Error destroying sandbox:', error);
            throw error;
        }
    }

    /**
     * Get sandbox status and metrics
     */
    async getSandboxMetrics(sandboxId: string): Promise<{
        cpuUsage: number;
        memoryUsage: number;
        networkUsage: number;
        status: string;
    }> {
        const sandbox = this.activeSandboxes.get(sandboxId);
        if (!sandbox) {
            throw new Error('Sandbox not found');
        }

        if (sandbox.containerId) {
            const container = this.docker.getContainer(sandbox.containerId);
            const stats = await container.stats({ stream: false });

            return {
                cpuUsage: this.calculateCpuUsage(stats),
                memoryUsage: stats.memory_stats.usage / stats.memory_stats.limit,
                networkUsage: this.calculateNetworkUsage(stats),
                status: sandbox.status
            };
        }

        return {
            cpuUsage: sandbox.cpuUsage,
            memoryUsage: sandbox.memoryUsage,
            networkUsage: sandbox.networkUsage,
            status: sandbox.status
        };
    }

    // Private methods for different sandbox levels

    private async createBasicSandbox(
        sandboxId: string,
        installationId: string,
        config: any
    ): Promise<SandboxEnvironment> {
        // Basic sandbox uses VM2 for simple JavaScript execution
        return {
            id: sandboxId,
            appId: '', // Will be set by caller
            installationId,
            status: 'running',
            imageId: 'vm2-basic',
            allocatedMemory: config.resources.memory,
            allocatedCpu: config.resources.cpu,
            allocatedStorage: config.resources.storage,
            securityLevel: SandboxLevel.BASIC,
            allowedDomains: [],
            blockedDomains: ['*'], // Block all external domains by default
            cpuUsage: 0,
            memoryUsage: 0,
            networkUsage: 0,
            createdAt: new Date()
        };
    }

    private async createStandardSandbox(
        sandboxId: string,
        installationId: string,
        config: any
    ): Promise<SandboxEnvironment> {
        // Standard sandbox uses Docker container with limited resources
        const container = await this.docker.createContainer({
            Image: 'node:18-alpine',
            name: `sandbox-${sandboxId}`,
            HostConfig: {
                Memory: config.resources.memory * 1024 * 1024, // Convert MB to bytes
                CpuQuota: Math.floor(config.resources.cpu * 100000), // CPU quota
                NetworkMode: config.resources.network ? 'bridge' : 'none',
                ReadonlyRootfs: true,
                SecurityOpt: ['no-new-privileges:true'],
                CapDrop: ['ALL'],
                CapAdd: ['CHOWN', 'SETUID', 'SETGID']
            },
            Env: [
                'NODE_ENV=sandbox',
                `SANDBOX_ID=${sandboxId}`,
                `MEMORY_LIMIT=${config.resources.memory}`,
                `CPU_LIMIT=${config.resources.cpu}`
            ],
            WorkingDir: '/app',
            Cmd: ['node', '-e', 'setInterval(() => {}, 1000)'] // Keep container alive
        });

        await container.start();

        return {
            id: sandboxId,
            appId: '',
            installationId,
            containerId: container.id,
            status: 'running',
            imageId: 'node:18-alpine',
            allocatedMemory: config.resources.memory,
            allocatedCpu: config.resources.cpu,
            allocatedStorage: config.resources.storage,
            securityLevel: SandboxLevel.STANDARD,
            allowedDomains: ['api.docusign-alternative.com'],
            blockedDomains: [],
            cpuUsage: 0,
            memoryUsage: 0,
            networkUsage: 0,
            createdAt: new Date()
        };
    }

    private async createStrictSandbox(
        sandboxId: string,
        installationId: string,
        config: any
    ): Promise<SandboxEnvironment> {
        // Strict sandbox with additional security measures
        const container = await this.docker.createContainer({
            Image: 'node:18-alpine',
            name: `sandbox-strict-${sandboxId}`,
            HostConfig: {
                Memory: config.resources.memory * 1024 * 1024,
                CpuQuota: Math.floor(config.resources.cpu * 100000),
                NetworkMode: 'none', // No network access
                ReadonlyRootfs: true,
                SecurityOpt: [
                    'no-new-privileges:true',
                    'seccomp:unconfined' // Custom seccomp profile would be better
                ],
                CapDrop: ['ALL'],
                Ulimits: [
                    { Name: 'nofile', Soft: 1024, Hard: 1024 },
                    { Name: 'nproc', Soft: 100, Hard: 100 }
                ]
            },
            Env: [
                'NODE_ENV=sandbox-strict',
                `SANDBOX_ID=${sandboxId}`,
                'NODE_OPTIONS=--max-old-space-size=128'
            ],
            WorkingDir: '/app',
            User: 'nobody:nobody'
        });

        await container.start();

        return {
            id: sandboxId,
            appId: '',
            installationId,
            containerId: container.id,
            status: 'running',
            imageId: 'node:18-alpine',
            allocatedMemory: config.resources.memory,
            allocatedCpu: config.resources.cpu,
            allocatedStorage: config.resources.storage,
            securityLevel: SandboxLevel.STRICT,
            allowedDomains: [],
            blockedDomains: ['*'],
            cpuUsage: 0,
            memoryUsage: 0,
            networkUsage: 0,
            createdAt: new Date()
        };
    }

    private async createIsolatedSandbox(
        sandboxId: string,
        installationId: string,
        config: any
    ): Promise<SandboxEnvironment> {
        // Isolated sandbox with maximum security (gVisor or similar)
        const container = await this.docker.createContainer({
            Image: 'gcr.io/gvisor-sandbox/node:18',
            name: `sandbox-isolated-${sandboxId}`,
            HostConfig: {
                Runtime: 'runsc', // gVisor runtime
                Memory: config.resources.memory * 1024 * 1024,
                CpuQuota: Math.floor(config.resources.cpu * 100000),
                NetworkMode: 'none',
                ReadonlyRootfs: true,
                SecurityOpt: ['no-new-privileges:true'],
                CapDrop: ['ALL'],
                PidsLimit: 50
            },
            Env: [
                'NODE_ENV=sandbox-isolated',
                `SANDBOX_ID=${sandboxId}`
            ],
            WorkingDir: '/app',
            User: 'sandbox:sandbox'
        });

        await container.start();

        return {
            id: sandboxId,
            appId: '',
            installationId,
            containerId: container.id,
            status: 'running',
            imageId: 'gcr.io/gvisor-sandbox/node:18',
            allocatedMemory: config.resources.memory,
            allocatedCpu: config.resources.cpu,
            allocatedStorage: config.resources.storage,
            securityLevel: SandboxLevel.ISOLATED,
            allowedDomains: [],
            blockedDomains: ['*'],
            cpuUsage: 0,
            memoryUsage: 0,
            networkUsage: 0,
            createdAt: new Date()
        };
    }

    // Execution methods for different sandbox levels

    private async executeInBasicSandbox(
        sandbox: SandboxEnvironment,
        code: string,
        context: any
    ): Promise<any> {
        const vm = new VM({
            timeout: 5000, // 5 second timeout
            sandbox: {
                console: {
                    log: (...args: any[]) => console.log(`[Sandbox ${sandbox.id}]`, ...args)
                },
                context,
                require: (module: string) => {
                    // Whitelist allowed modules
                    const allowedModules = ['lodash', 'moment', 'crypto'];
                    if (allowedModules.includes(module)) {
                        return require(module);
                    }
                    throw new Error(`Module '${module}' is not allowed`);
                }
            }
        });

        return vm.run(code);
    }

    private async executeInStandardSandbox(
        sandbox: SandboxEnvironment,
        code: string,
        context: any
    ): Promise<any> {
        if (!sandbox.containerId) {
            throw new Error('Container not available');
        }

        const container = this.docker.getContainer(sandbox.containerId);

        // Create execution script
        const script = `
      const context = ${JSON.stringify(context)};
      try {
        const result = (function() {
          ${code}
        })();
        console.log(JSON.stringify({ success: true, result }));
      } catch (error) {
        console.log(JSON.stringify({ success: false, error: error.message }));
      }
    `;

        const exec = await container.exec({
            Cmd: ['node', '-e', script],
            AttachStdout: true,
            AttachStderr: true
        });

        const stream = await exec.start({ hijack: true, stdin: false });

        return new Promise((resolve, reject) => {
            let output = '';

            stream.on('data', (chunk: Buffer) => {
                output += chunk.toString();
            });

            stream.on('end', () => {
                try {
                    const result = JSON.parse(output.trim());
                    if (result.success) {
                        resolve(result.result);
                    } else {
                        reject(new Error(result.error));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse execution result'));
                }
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                reject(new Error('Execution timeout'));
            }, 30000);
        });
    }

    private async executeInStrictSandbox(
        sandbox: SandboxEnvironment,
        code: string,
        context: any
    ): Promise<any> {
        // Similar to standard but with additional restrictions
        return this.executeInStandardSandbox(sandbox, code, context);
    }

    private async executeInIsolatedSandbox(
        sandbox: SandboxEnvironment,
        code: string,
        context: any
    ): Promise<any> {
        // Similar to standard but with gVisor isolation
        return this.executeInStandardSandbox(sandbox, code, context);
    }

    // Utility methods

    private generateSandboxId(): string {
        return `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private calculateCpuUsage(stats: any): number {
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const numberCpus = stats.cpu_stats.online_cpus || 1;

        return (cpuDelta / systemDelta) * numberCpus * 100;
    }

    private calculateNetworkUsage(stats: any): number {
        if (!stats.networks) return 0;

        let totalBytes = 0;
        for (const network of Object.values(stats.networks) as any[]) {
            totalBytes += network.rx_bytes + network.tx_bytes;
        }

        return totalBytes;
    }
}