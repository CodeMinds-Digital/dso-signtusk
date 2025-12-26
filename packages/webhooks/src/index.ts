// Types and schemas
export * from './types';

// Core services
export { WebhookService } from './webhook-service';
export { HmacWebhookSignatureService } from './signature-service';
export { HttpWebhookDeliveryService } from './delivery-service';
export { DefaultWebhookEventEmitter, BatchedWebhookEventEmitter } from './event-emitter';

// Repository implementations
export { PrismaWebhookRepository, PrismaWebhookDeliveryRepository } from './repository';

// Factory function for easy setup
import { PrismaClient } from '@signtusk/database';
import { JobService } from '@signtusk/jobs';
import { WebhookService } from './webhook-service';
import { HmacWebhookSignatureService } from './signature-service';
import { HttpWebhookDeliveryService } from './delivery-service';
import { DefaultWebhookEventEmitter, BatchedWebhookEventEmitter } from './event-emitter';
import { PrismaWebhookRepository, PrismaWebhookDeliveryRepository } from './repository';

export interface WebhookServiceConfig {
    prisma: PrismaClient;
    jobService: JobService;
    signatureAlgorithm?: string;
    signatureTolerance?: number;
    enableBatching?: boolean;
    batchSize?: number;
    batchTimeout?: number;
}

export function createWebhookService(config: WebhookServiceConfig): WebhookService {
    // Create repositories
    const webhookRepository = new PrismaWebhookRepository(config.prisma);
    const deliveryRepository = new PrismaWebhookDeliveryRepository(config.prisma);

    // Create signature service
    const signatureService = new HmacWebhookSignatureService(
        config.signatureAlgorithm || 'sha256',
        config.signatureTolerance || 300
    );

    // Create delivery service
    const deliveryService = new HttpWebhookDeliveryService(
        deliveryRepository,
        webhookRepository,
        signatureService,
        config.jobService
    );

    // Create event emitter
    const baseEmitter = new DefaultWebhookEventEmitter(
        webhookRepository,
        deliveryRepository,
        deliveryService
    );

    const eventEmitter = config.enableBatching
        ? new BatchedWebhookEventEmitter(
            baseEmitter,
            config.batchSize || 100,
            config.batchTimeout || 1000
        )
        : baseEmitter;

    // Create main service
    return new WebhookService(
        webhookRepository,
        deliveryRepository,
        eventEmitter,
        deliveryService,
        signatureService
    );
}