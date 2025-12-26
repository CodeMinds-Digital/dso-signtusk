/**
 * Event service for real-time event subscriptions
 */

import { BaseService } from './base';
import { EventSubscription } from '../types';

export class EventService extends BaseService {
    private subscriptions: Map<string, EventSubscription[]> = new Map();
    private websocket?: WebSocket;

    async subscribe(event: string, callback: (data: any) => void): Promise<void> {
        if (!this.subscriptions.has(event)) {
            this.subscriptions.set(event, []);
        }

        this.subscriptions.get(event)!.push({ event, callback });

        // Initialize WebSocket connection if not already connected
        if (!this.websocket) {
            await this.initializeWebSocket();
        }

        // Send subscription message
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'subscribe',
                event
            }));
        }
    }

    unsubscribe(event: string, callback?: (data: any) => void): void {
        if (!this.subscriptions.has(event)) {
            return;
        }

        if (callback) {
            const subscriptions = this.subscriptions.get(event)!;
            const index = subscriptions.findIndex(sub => sub.callback === callback);
            if (index !== -1) {
                subscriptions.splice(index, 1);
            }
        } else {
            this.subscriptions.delete(event);
        }

        // Send unsubscribe message
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: 'unsubscribe',
                event
            }));
        }
    }

    disconnect(): void {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = undefined;
        }
        this.subscriptions.clear();
    }

    private async initializeWebSocket(): Promise<void> {
        const config = this.client.getConfig();
        const wsUrl = config.baseURL.replace(/^http/, 'ws') + '/ws';

        return new Promise((resolve, reject) => {
            try {
                this.websocket = new WebSocket(wsUrl);

                this.websocket.onopen = () => {
                    // Authenticate WebSocket connection
                    this.websocket!.send(JSON.stringify({
                        type: 'auth',
                        token: config.apiKey || config.jwt.token
                    }));
                    resolve();
                };

                this.websocket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };

                this.websocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };

                this.websocket.onclose = () => {
                    this.websocket = undefined;
                    // Attempt to reconnect after a delay
                    setTimeout(() => {
                        if (this.subscriptions.size > 0) {
                            this.initializeWebSocket();
                        }
                    }, 5000);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    private handleMessage(data: any): void {
        if (data.type === 'event' && data.event) {
            const subscriptions = this.subscriptions.get(data.event);
            if (subscriptions) {
                subscriptions.forEach(sub => {
                    try {
                        sub.callback(data.payload);
                    } catch (error) {
                        console.error('Error in event callback:', error);
                    }
                });
            }
        }
    }
}