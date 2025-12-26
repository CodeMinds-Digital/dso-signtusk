import { StorageService, StorageConfig, StorageConfigSchema } from './types';
import { S3StorageService } from './s3-service';
import { LocalStorageService } from './local-service';

export class StorageServiceFactory {
    static create(config: StorageConfig): StorageService {
        const validatedConfig = StorageConfigSchema.parse(config);

        switch (validatedConfig.provider) {
            case 's3':
                return new S3StorageService(validatedConfig);
            case 'local':
                return new LocalStorageService(validatedConfig);
            default:
                throw new Error(`Unsupported storage provider: ${validatedConfig.provider}`);
        }
    }
}