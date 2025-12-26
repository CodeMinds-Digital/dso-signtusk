import { BaseConnector, ConnectorConfig } from './connector-framework';

/**
 * Mock connector for testing purposes that doesn't make real network calls
 */
export class MockConnector extends BaseConnector {
    private mockData: any[] = [];
    private mockSchema: any = {
        type: 'object',
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
        },
    };

    async initialize(): Promise<void> {
        // Mock initialization - no actual setup needed
        this.emit('initialized');
    }

    async connect(): Promise<void> {
        // Mock connection - always succeeds
        this.isConnected = true;
        this.emit('connected');
    }

    async disconnect(): Promise<void> {
        // Mock disconnection
        this.isConnected = false;
        this.emit('disconnected');
    }

    async read(query?: any): Promise<any[]> {
        // Return mock data, optionally filtered by query
        let result = [...this.mockData];

        if (query) {
            if (query.id) {
                result = result.filter(item => item.id === query.id);
            }
            if (query.limit) {
                result = result.slice(0, query.limit);
            }
        }

        return result;
    }

    async write(data: any[]): Promise<void> {
        // Mock write - add data to mock storage
        for (const item of data) {
            const newItem = {
                ...item,
                id: item.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: item.createdAt || new Date().toISOString(),
            };
            this.mockData.push(newItem);
        }

        this.emit('dataWritten', { count: data.length });
    }

    async update(data: any[]): Promise<void> {
        // Mock update - update existing items in mock storage
        for (const item of data) {
            const index = this.mockData.findIndex(existing => existing.id === item.id);
            if (index !== -1) {
                this.mockData[index] = {
                    ...this.mockData[index],
                    ...item,
                    updatedAt: new Date().toISOString(),
                };
            }
        }

        this.emit('dataUpdated', { count: data.length });
    }

    async delete(ids: string[]): Promise<void> {
        // Mock delete - remove items from mock storage
        this.mockData = this.mockData.filter(item => !ids.includes(item.id));
        this.emit('dataDeleted', { count: ids.length });
    }

    async getSchema(): Promise<any> {
        // Return mock schema
        return this.mockSchema;
    }

    // Test helper methods
    setMockData(data: any[]): void {
        this.mockData = [...data];
    }

    getMockData(): any[] {
        return [...this.mockData];
    }

    clearMockData(): void {
        this.mockData = [];
    }

    setMockSchema(schema: any): void {
        this.mockSchema = schema;
    }
}