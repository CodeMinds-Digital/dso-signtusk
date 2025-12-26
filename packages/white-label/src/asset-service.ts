import { z } from 'zod';
import * as crypto from 'node:crypto';
import sharp from 'sharp';
import {
    BrandAsset,
    BrandAssetSchema,
    AssetMetadata,
    AssetUploadResult
} from './types';

export interface AssetServiceOptions {
    storageService: any;
    databaseService: any;
    maxFileSize: number; // in bytes
    allowedMimeTypes: string[];
    thumbnailSizes: { width: number; height: number }[];
    cdnBaseUrl?: string;
}

export class AssetService {
    private storageService: any;
    private databaseService: any;
    private maxFileSize: number;
    private allowedMimeTypes: string[];
    private thumbnailSizes: { width: number; height: number }[];
    private cdnBaseUrl?: string;

    constructor(options: AssetServiceOptions) {
        this.storageService = options.storageService;
        this.databaseService = options.databaseService;
        this.maxFileSize = options.maxFileSize;
        this.allowedMimeTypes = options.allowedMimeTypes;
        this.thumbnailSizes = options.thumbnailSizes;
        this.cdnBaseUrl = options.cdnBaseUrl;
    }

    // ============================================================================
    // ASSET UPLOAD AND MANAGEMENT
    // ============================================================================

    async uploadAsset(
        organizationId: string,
        brandingId: string,
        file: {
            buffer: Buffer;
            originalName: string;
            mimeType: string;
        },
        metadata: {
            type: BrandAsset['type'];
            category?: string;
            name: string;
            description?: string;
            tags?: string[];
        },
        createdBy: string
    ): Promise<AssetUploadResult> {
        // Validate file
        await this.validateFile(file);

        // Generate unique filename
        const hash = this.generateFileHash(file.buffer);
        const extension = this.getFileExtension(file.originalName);
        const filename = `${hash}${extension}`;

        // Process image if it's an image file
        let processedBuffer = file.buffer;
        let imageMetadata: { width?: number; height?: number } = {};

        if (this.isImageFile(file.mimeType)) {
            const result = await this.processImage(file.buffer, metadata.type);
            processedBuffer = result.buffer;
            imageMetadata = result.metadata;
        }

        // Upload main file
        const uploadPath = `assets/${organizationId}/${brandingId}/${filename}`;
        const url = await this.storageService.uploadFile(uploadPath, processedBuffer, file.mimeType);

        // Generate thumbnails for images
        let thumbnailUrl: string | undefined;
        if (this.isImageFile(file.mimeType)) {
            thumbnailUrl = await this.generateThumbnails(
                file.buffer,
                organizationId,
                brandingId,
                hash
            );
        }

        // Create asset metadata
        const assetMetadata: AssetMetadata = {
            filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: processedBuffer.length,
            width: imageMetadata.width,
            height: imageMetadata.height,
            hash,
            url: this.cdnBaseUrl ? `${this.cdnBaseUrl}/${uploadPath}` : url,
            thumbnailUrl,
        };

        // Save to database
        const asset = await this.databaseService.brandAsset.create({
            data: {
                organizationId,
                brandingId,
                type: metadata.type,
                category: metadata.category,
                name: metadata.name,
                description: metadata.description,
                metadata: assetMetadata,
                tags: metadata.tags || [],
                createdBy,
            },
        });

        return {
            asset,
            uploadUrl: url,
            thumbnailUrl,
        };
    }

    async updateAsset(
        assetId: string,
        updates: {
            name?: string;
            description?: string;
            category?: string;
            tags?: string[];
        }
    ): Promise<BrandAsset> {
        const existingAsset = await this.getAsset(assetId);
        if (!existingAsset) {
            throw new Error('Asset not found');
        }

        const updatedAsset = await this.databaseService.brandAsset.update({
            where: { id: assetId },
            data: {
                ...updates,
                updatedAt: new Date(),
            },
        });

        return updatedAsset;
    }

    async getAsset(assetId: string): Promise<BrandAsset | null> {
        return await this.databaseService.brandAsset.findUnique({
            where: { id: assetId },
        });
    }

    async getAssetsByBranding(
        brandingId: string,
        filters?: {
            type?: BrandAsset['type'];
            category?: string;
            tags?: string[];
            search?: string;
        }
    ): Promise<BrandAsset[]> {
        const where: any = {
            brandingId,
            isActive: true,
        };

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.tags && filters.tags.length > 0) {
            where.tags = {
                hasSome: filters.tags,
            };
        }

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return await this.databaseService.brandAsset.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteAsset(assetId: string): Promise<void> {
        const asset = await this.getAsset(assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }

        // Delete files from storage
        await this.deleteAssetFiles(asset);

        // Soft delete from database
        await this.databaseService.brandAsset.update({
            where: { id: assetId },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });
    }

    // ============================================================================
    // ASSET VERSIONING
    // ============================================================================

    async createAssetVersion(
        assetId: string,
        file: {
            buffer: Buffer;
            originalName: string;
            mimeType: string;
        },
        createdBy: string
    ): Promise<BrandAsset> {
        const originalAsset = await this.getAsset(assetId);
        if (!originalAsset) {
            throw new Error('Original asset not found');
        }

        // Mark original as inactive
        await this.databaseService.brandAsset.update({
            where: { id: assetId },
            data: { isActive: false },
        });

        // Create new version
        const newVersion = await this.uploadAsset(
            originalAsset.organizationId,
            originalAsset.brandingId,
            file,
            {
                type: originalAsset.type,
                category: originalAsset.category,
                name: originalAsset.name,
                description: originalAsset.description,
                tags: originalAsset.tags,
            },
            createdBy
        );

        // Update version number
        await this.databaseService.brandAsset.update({
            where: { id: newVersion.asset.id },
            data: {
                version: originalAsset.version + 1,
            },
        });

        return newVersion.asset;
    }

    async getAssetVersions(assetId: string): Promise<BrandAsset[]> {
        const asset = await this.getAsset(assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }

        return await this.databaseService.brandAsset.findMany({
            where: {
                organizationId: asset.organizationId,
                brandingId: asset.brandingId,
                name: asset.name,
                type: asset.type,
            },
            orderBy: { version: 'desc' },
        });
    }

    async rollbackAssetVersion(assetId: string, targetVersion: number): Promise<BrandAsset> {
        const versions = await this.getAssetVersions(assetId);
        const targetAsset = versions.find(v => v.version === targetVersion);

        if (!targetAsset) {
            throw new Error('Target version not found');
        }

        // Mark all newer versions as inactive
        await this.databaseService.brandAsset.updateMany({
            where: {
                organizationId: targetAsset.organizationId,
                brandingId: targetAsset.brandingId,
                name: targetAsset.name,
                type: targetAsset.type,
                version: { gt: targetVersion },
            },
            data: { isActive: false },
        });

        // Mark target version as active
        await this.databaseService.brandAsset.update({
            where: { id: targetAsset.id },
            data: { isActive: true },
        });

        return targetAsset;
    }

    // ============================================================================
    // IMAGE PROCESSING
    // ============================================================================

    private async processImage(
        buffer: Buffer,
        assetType: BrandAsset['type']
    ): Promise<{ buffer: Buffer; metadata: { width: number; height: number } }> {
        let sharpInstance = sharp(buffer);

        // Get original metadata
        const metadata = await sharpInstance.metadata();

        // Apply type-specific processing
        switch (assetType) {
            case 'logo':
                // Optimize logos for web use
                sharpInstance = sharpInstance
                    .resize(800, 400, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .png({ quality: 90 });
                break;

            case 'favicon':
                // Generate standard favicon sizes
                sharpInstance = sharpInstance
                    .resize(32, 32, { fit: 'cover' })
                    .png();
                break;

            case 'icon':
                // Optimize icons
                sharpInstance = sharpInstance
                    .resize(256, 256, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .png({ quality: 90 });
                break;

            case 'background':
                // Optimize background images
                sharpInstance = sharpInstance
                    .resize(1920, 1080, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ quality: 85 });
                break;

            default:
                // General image optimization
                sharpInstance = sharpInstance
                    .resize(1200, 1200, {
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                break;
        }

        const processedBuffer = await sharpInstance.toBuffer();
        const processedMetadata = await sharp(processedBuffer).metadata();

        return {
            buffer: processedBuffer,
            metadata: {
                width: processedMetadata.width!,
                height: processedMetadata.height!,
            },
        };
    }

    private async generateThumbnails(
        buffer: Buffer,
        organizationId: string,
        brandingId: string,
        hash: string
    ): Promise<string> {
        const thumbnails: string[] = [];

        for (const size of this.thumbnailSizes) {
            const thumbnailBuffer = await sharp(buffer)
                .resize(size.width, size.height, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toBuffer();

            const thumbnailPath = `assets/${organizationId}/${brandingId}/thumbnails/${hash}_${size.width}x${size.height}.jpg`;
            const thumbnailUrl = await this.storageService.uploadFile(
                thumbnailPath,
                thumbnailBuffer,
                'image/jpeg'
            );

            thumbnails.push(thumbnailUrl);
        }

        // Return the first (smallest) thumbnail URL
        return this.cdnBaseUrl
            ? `${this.cdnBaseUrl}/assets/${organizationId}/${brandingId}/thumbnails/${hash}_${this.thumbnailSizes[0].width}x${this.thumbnailSizes[0].height}.jpg`
            : thumbnails[0];
    }

    // ============================================================================
    // ASSET OPTIMIZATION
    // ============================================================================

    async optimizeAsset(assetId: string): Promise<BrandAsset> {
        const asset = await this.getAsset(assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }

        if (!this.isImageFile(asset.metadata.mimeType)) {
            throw new Error('Asset optimization is only supported for images');
        }

        // Download original file
        const originalBuffer = await this.storageService.downloadFile(asset.metadata.url);

        // Optimize the image
        const optimizedResult = await this.processImage(originalBuffer, asset.type);

        // Calculate size reduction
        const originalSize = asset.metadata.size;
        const optimizedSize = optimizedResult.buffer.length;
        const reduction = ((originalSize - optimizedSize) / originalSize) * 100;

        // Only update if there's significant reduction (>10%)
        if (reduction > 10) {
            // Upload optimized version
            const hash = this.generateFileHash(optimizedResult.buffer);
            const extension = this.getFileExtension(asset.metadata.filename);
            const filename = `${hash}${extension}`;
            const uploadPath = `assets/${asset.organizationId}/${asset.brandingId}/${filename}`;

            const url = await this.storageService.uploadFile(
                uploadPath,
                optimizedResult.buffer,
                asset.metadata.mimeType
            );

            // Update asset metadata
            const updatedMetadata: AssetMetadata = {
                ...asset.metadata,
                filename,
                size: optimizedSize,
                width: optimizedResult.metadata.width,
                height: optimizedResult.metadata.height,
                hash,
                url: this.cdnBaseUrl ? `${this.cdnBaseUrl}/${uploadPath}` : url,
            };

            // Update in database
            const updatedAsset = await this.databaseService.brandAsset.update({
                where: { id: assetId },
                data: {
                    metadata: updatedMetadata,
                    version: asset.version + 1,
                    updatedAt: new Date(),
                },
            });

            // Delete old file
            await this.storageService.deleteFile(asset.metadata.url);

            return updatedAsset;
        }

        return asset;
    }

    async bulkOptimizeAssets(brandingId: string): Promise<{
        optimized: number;
        skipped: number;
        totalSizeSaved: number;
    }> {
        const assets = await this.getAssetsByBranding(brandingId, { type: 'image' });

        let optimized = 0;
        let skipped = 0;
        let totalSizeSaved = 0;

        for (const asset of assets) {
            try {
                const originalSize = asset.metadata.size;
                const optimizedAsset = await this.optimizeAsset(asset.id);

                if (optimizedAsset.metadata.size < originalSize) {
                    optimized++;
                    totalSizeSaved += originalSize - optimizedAsset.metadata.size;
                } else {
                    skipped++;
                }
            } catch (error) {
                console.error(`Failed to optimize asset ${asset.id}:`, error);
                skipped++;
            }
        }

        return {
            optimized,
            skipped,
            totalSizeSaved,
        };
    }

    // ============================================================================
    // ASSET VALIDATION
    // ============================================================================

    private async validateFile(file: {
        buffer: Buffer;
        originalName: string;
        mimeType: string;
    }): Promise<void> {
        // Check file size
        if (file.buffer.length > this.maxFileSize) {
            throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
        }

        // Check MIME type
        if (!this.allowedMimeTypes.includes(file.mimeType)) {
            throw new Error(`File type ${file.mimeType} is not allowed`);
        }

        // Validate file content matches MIME type
        if (this.isImageFile(file.mimeType)) {
            try {
                await sharp(file.buffer).metadata();
            } catch (error) {
                throw new Error('Invalid image file');
            }
        }

        // Check for malicious content (basic check)
        await this.scanForMaliciousContent(file.buffer);
    }

    private async scanForMaliciousContent(buffer: Buffer): Promise<void> {
        // Basic malicious content detection
        const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));

        // Check for common script tags and malicious patterns
        const maliciousPatterns = [
            /<script/i,
            /javascript:/i,
            /vbscript:/i,
            /onload=/i,
            /onerror=/i,
            /eval\(/i,
        ];

        for (const pattern of maliciousPatterns) {
            if (pattern.test(content)) {
                throw new Error('File contains potentially malicious content');
            }
        }
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    private generateFileHash(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
    }

    private getFileExtension(filename: string): string {
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.substring(lastDot) : '';
    }

    private isImageFile(mimeType: string): boolean {
        return mimeType.startsWith('image/');
    }

    private async deleteAssetFiles(asset: BrandAsset): Promise<void> {
        try {
            // Delete main file
            await this.storageService.deleteFile(asset.metadata.url);

            // Delete thumbnail if it exists
            if (asset.metadata.thumbnailUrl) {
                await this.storageService.deleteFile(asset.metadata.thumbnailUrl);
            }

            // Delete all thumbnail sizes
            for (const size of this.thumbnailSizes) {
                const thumbnailPath = `assets/${asset.organizationId}/${asset.brandingId}/thumbnails/${asset.metadata.hash}_${size.width}x${size.height}.jpg`;
                try {
                    await this.storageService.deleteFile(thumbnailPath);
                } catch (error) {
                    // Ignore errors for thumbnails that might not exist
                }
            }
        } catch (error) {
            console.error(`Error deleting files for asset ${asset.id}:`, error);
        }
    }

    // ============================================================================
    // ASSET ANALYTICS
    // ============================================================================

    async getAssetUsageStats(brandingId: string): Promise<{
        totalAssets: number;
        totalSize: number;
        assetsByType: Record<string, number>;
        sizeByType: Record<string, number>;
        averageFileSize: number;
    }> {
        const assets = await this.getAssetsByBranding(brandingId);

        const stats = {
            totalAssets: assets.length,
            totalSize: 0,
            assetsByType: {} as Record<string, number>,
            sizeByType: {} as Record<string, number>,
            averageFileSize: 0,
        };

        for (const asset of assets) {
            stats.totalSize += asset.metadata.size;

            stats.assetsByType[asset.type] = (stats.assetsByType[asset.type] || 0) + 1;
            stats.sizeByType[asset.type] = (stats.sizeByType[asset.type] || 0) + asset.metadata.size;
        }

        stats.averageFileSize = stats.totalAssets > 0 ? stats.totalSize / stats.totalAssets : 0;

        return stats;
    }

    async findDuplicateAssets(brandingId: string): Promise<Array<{
        hash: string;
        assets: BrandAsset[];
    }>> {
        const assets = await this.getAssetsByBranding(brandingId);
        const hashGroups = new Map<string, BrandAsset[]>();

        for (const asset of assets) {
            const hash = asset.metadata.hash;
            if (!hashGroups.has(hash)) {
                hashGroups.set(hash, []);
            }
            hashGroups.get(hash)!.push(asset);
        }

        return Array.from(hashGroups.entries())
            .filter(([_, assets]) => assets.length > 1)
            .map(([hash, assets]) => ({ hash, assets }));
    }
}