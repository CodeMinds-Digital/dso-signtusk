import { EventEmitter } from 'events';
import { PDFDocument } from 'pdf-lib';
import { generateId } from '@signtusk/lib';
import { JobService } from '@signtusk/jobs';
import { PDFEngine } from './pdf-engine';
import { DigitalSignatureEngineImpl } from './digital-signature-engine';
import { SignatureAppearanceEngine } from './signature-appearance-engine';
import type {
    BatchSigningRequest,
    BatchSigningResult,
    BatchSigningProgress,
    BatchSigningOptions,
    BatchDocumentPreparation,
    BatchSignatureApplication,
    BatchProgressReport,
    BatchErrorRecovery,
    BatchSigningError as IBatchSigningError,
    BatchOperationStatus,
    BatchDocumentStatus,
    BatchSigningMetrics,
    BatchSigningAuditEntry,
    SignatureFieldInfo,
    X509Certificate,
    CMSSignature
} from './types';
import {
    BatchSigningError as BatchSigningErrorClass,
    BatchPreparationError,
    BatchProcessingError
} from './types';

/**
 * Batch Signing Engine for processing multiple documents with signatures
 * Provides bulk document preparation, signature application, progress tracking, and error recovery
 */
export class BatchSigningEngine extends EventEmitter {
    private pdfEngine: PDFEngine;
    private signatureEngine: DigitalSignatureEngineImpl;
    private appearanceEngine: SignatureAppearanceEngine;
    private jobService?: JobService;
    private activeBatches: Map<string, BatchSigningProgress> = new Map();
    private batchMetrics: Map<string, BatchSigningMetrics> = new Map();

    constructor(
        pdfEngine?: PDFEngine,
        signatureEngine?: DigitalSignatureEngineImpl,
        jobService?: JobService
    ) {
        super();
        this.pdfEngine = pdfEngine || new PDFEngine();
        this.signatureEngine = signatureEngine || new DigitalSignatureEngineImpl();
        this.appearanceEngine = new SignatureAppearanceEngine();
        this.jobService = jobService;
    }

    /**
     * Start a batch signing operation
     */
    async startBatchSigning(request: BatchSigningRequest): Promise<BatchSigningResult> {
        const batchId = generateId();
        const startTime = Date.now();

        try {
            // Initialize batch progress tracking
            const progress: BatchSigningProgress = {
                batchId,
                status: 'preparing',
                totalDocuments: request.documents.length,
                processedDocuments: 0,
                successfulDocuments: 0,
                failedDocuments: 0,
                startedAt: new Date(),
                documents: request.documents.map(doc => ({
                    documentId: doc.documentId,
                    status: 'pending',
                    progress: 0,
                    signatures: []
                })),
                errors: [],
                estimatedCompletion: this.estimateCompletionTime(request.documents.length)
            };

            this.activeBatches.set(batchId, progress);
            this.emit('batchStarted', { batchId, progress });

            // Initialize metrics
            const metrics: BatchSigningMetrics = {
                batchId,
                totalDocuments: request.documents.length,
                totalSignatures: request.documents.reduce((sum, doc) => sum + doc.signatures.length, 0),
                processingStartTime: startTime,
                documentPreparationTime: 0,
                signatureApplicationTime: 0,
                totalProcessingTime: 0,
                averageDocumentTime: 0,
                throughputPerMinute: 0,
                errorRate: 0,
                retryCount: 0
            };

            this.batchMetrics.set(batchId, metrics);

            // Process batch based on options
            if (request.options?.useJobQueue && this.jobService) {
                return await this.processBatchWithJobQueue(batchId, request);
            } else {
                return await this.processBatchDirectly(batchId, request);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            this.updateBatchProgress(batchId, {
                status: 'failed',
                completedAt: new Date(),
                errors: [{
                    type: 'batch_initialization',
                    message: errorMessage,
                    timestamp: new Date(),
                    recoverable: false,
                    code: 'BATCH_INIT_ERROR',
                    name: 'BatchInitializationError'
                }]
            });

            throw new BatchSigningErrorClass(
                `Failed to start batch signing: ${errorMessage}`,
                'BATCH_START_ERROR',
                batchId
            );
        }
    }

    /**
     * Process batch directly (synchronous processing)
     */
    private async processBatchDirectly(
        batchId: string,
        request: BatchSigningRequest
    ): Promise<BatchSigningResult> {
        const progress = this.activeBatches.get(batchId)!;
        const metrics = this.batchMetrics.get(batchId)!;
        const results: BatchSigningResult = {
            batchId,
            success: true,
            processedDocuments: [],
            totalDocuments: request.documents.length,
            successfulDocuments: 0,
            failedDocuments: 0,
            processingTime: 0,
            errors: [],
            metrics: {
                averageDocumentTime: 0,
                throughputPerMinute: 0,
                errorRate: 0
            }
        };

        try {
            // Phase 1: Document Preparation
            this.updateBatchProgress(batchId, { status: 'preparing' });
            const preparationStartTime = Date.now();

            const preparedDocuments = await this.prepareBatchDocuments(
                batchId,
                request.documents,
                request.options
            );

            metrics.documentPreparationTime = Date.now() - preparationStartTime;

            // Phase 2: Signature Application
            this.updateBatchProgress(batchId, { status: 'signing' });
            const signingStartTime = Date.now();

            for (let i = 0; i < preparedDocuments.length; i++) {
                const docPrep = preparedDocuments[i];
                const docRequest = request.documents[i];

                try {
                    const docResult = await this.processDocumentSigning(
                        batchId,
                        docPrep,
                        docRequest,
                        request.options
                    );

                    results.processedDocuments.push(docResult);

                    if (docResult.success) {
                        results.successfulDocuments++;
                        this.updateDocumentProgress(batchId, docRequest.documentId, {
                            status: 'completed',
                            progress: 100,
                            completedAt: new Date()
                        });
                    } else {
                        results.failedDocuments++;
                        results.errors.push(...docResult.errors || []);
                        this.updateDocumentProgress(batchId, docRequest.documentId, {
                            status: 'failed',
                            progress: 0,
                            errors: docResult.errors
                        });
                    }

                    progress.processedDocuments++;
                    this.emit('documentProcessed', { batchId, documentId: docRequest.documentId, result: docResult });

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    const docError = {
                        type: 'document_processing' as const,
                        documentId: docRequest.documentId,
                        message: errorMessage,
                        timestamp: new Date(),
                        recoverable: this.isRecoverableError(error),
                        code: 'DOC_PROCESSING_ERROR',
                        name: 'DocumentProcessingError'
                    };

                    results.failedDocuments++;
                    results.errors.push(docError);
                    progress.processedDocuments++;

                    this.updateDocumentProgress(batchId, docRequest.documentId, {
                        status: 'failed',
                        progress: 0,
                        errors: [docError]
                    });

                    // Attempt recovery if enabled
                    if (request.options?.enableErrorRecovery && docError.recoverable) {
                        await this.attemptErrorRecovery(batchId, docRequest.documentId, error);
                    }
                }

                // Update progress
                const progressPercent = Math.round((progress.processedDocuments / progress.totalDocuments) * 100);
                this.updateBatchProgress(batchId, {
                    processedDocuments: progress.processedDocuments,
                    successfulDocuments: results.successfulDocuments,
                    failedDocuments: results.failedDocuments
                });

                this.emit('progressUpdate', { batchId, progress: progressPercent });
            }

            metrics.signatureApplicationTime = Date.now() - signingStartTime;
            metrics.totalProcessingTime = Date.now() - metrics.processingStartTime;
            metrics.averageDocumentTime = metrics.totalProcessingTime / request.documents.length;
            metrics.throughputPerMinute = (request.documents.length / metrics.totalProcessingTime) * 60000;
            metrics.errorRate = (results.failedDocuments / results.totalDocuments) * 100;

            // Finalize batch
            const finalStatus = results.failedDocuments === 0 ? 'completed' :
                results.successfulDocuments === 0 ? 'failed' : 'partial';

            this.updateBatchProgress(batchId, {
                status: finalStatus,
                completedAt: new Date(),
                errors: results.errors
            });

            results.success = finalStatus !== 'failed';
            results.processingTime = metrics.totalProcessingTime;
            results.metrics = {
                averageDocumentTime: metrics.averageDocumentTime,
                throughputPerMinute: metrics.throughputPerMinute,
                errorRate: metrics.errorRate
            };

            this.emit('batchCompleted', { batchId, result: results });

            return results;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            this.updateBatchProgress(batchId, {
                status: 'failed',
                completedAt: new Date(),
                errors: [{
                    type: 'batch_processing',
                    message: errorMessage,
                    timestamp: new Date(),
                    recoverable: false,
                    code: 'BATCH_PROCESSING_ERROR',
                    name: 'BatchProcessingError'
                }]
            });

            throw new BatchSigningErrorClass(
                `Batch processing failed: ${errorMessage}`,
                'BATCH_PROCESSING_ERROR',
                batchId
            );
        }
    }

    /**
     * Process batch using job queue (asynchronous processing)
     */
    private async processBatchWithJobQueue(
        batchId: string,
        request: BatchSigningRequest
    ): Promise<BatchSigningResult> {
        if (!this.jobService) {
            throw new BatchSigningErrorClass(
                'Job service not available for queue processing',
                'JOB_SERVICE_UNAVAILABLE',
                batchId
            );
        }

        // Define batch processing job if not already defined
        this.jobService.defineJob({
            name: 'batch-document-signing',
            handler: async (payload: any) => {
                return await this.processDocumentSigningJob(payload);
            },
            config: {
                maxRetries: request.options?.maxRetries || 3,
                timeout: request.options?.timeout || 300000, // 5 minutes
                concurrency: request.options?.concurrency || 5
            }
        });

        // Queue all documents for processing
        const jobIds: string[] = [];
        for (const document of request.documents) {
            const jobId = await this.jobService.enqueue('batch-document-signing', {
                batchId,
                document,
                options: request.options
            });
            jobIds.push(jobId);
        }

        // Monitor job progress
        return await this.monitorBatchJobs(batchId, jobIds, request.documents.length);
    }

    /**
     * Prepare documents for batch signing
     */
    private async prepareBatchDocuments(
        batchId: string,
        documents: BatchSigningRequest['documents'],
        options?: BatchSigningOptions
    ): Promise<BatchDocumentPreparation[]> {
        const preparations: BatchDocumentPreparation[] = [];

        for (const docRequest of documents) {
            try {
                // Load and validate PDF
                const pdfDoc = await this.pdfEngine.loadPDF(docRequest.documentBuffer);

                // Validate signature fields
                const validationResult = await this.validateSignatureFields(pdfDoc, docRequest.signatures);

                if (!validationResult.isValid) {
                    throw new Error(`Invalid signature fields: ${validationResult.errors.join(', ')}`);
                }

                // Optimize document if requested
                let optimizedDoc = pdfDoc;
                if (options?.optimizeDocuments) {
                    optimizedDoc = await this.pdfEngine.optimizePDF(pdfDoc, {
                        compressImages: true,
                        removeUnusedObjects: true,
                        optimizeFonts: true,
                        linearize: false,
                        quality: 85
                    });
                }

                preparations.push({
                    documentId: docRequest.documentId,
                    pdfDocument: optimizedDoc,
                    signatures: docRequest.signatures,
                    metadata: {
                        originalSize: docRequest.documentBuffer.length,
                        optimizedSize: (await optimizedDoc.save()).length,
                        pageCount: optimizedDoc.getPageCount(),
                        signatureCount: docRequest.signatures.length
                    }
                });

            } catch (error) {
                throw new BatchSigningErrorClass(
                    `Failed to prepare document ${docRequest.documentId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    'DOCUMENT_PREPARATION_ERROR',
                    batchId,
                    docRequest.documentId
                );
            }
        }

        return preparations;
    }

    /**
     * Process signing for a single document
     */
    private async processDocumentSigning(
        batchId: string,
        preparation: BatchDocumentPreparation,
        request: BatchSigningRequest['documents'][0],
        options?: BatchSigningOptions
    ): Promise<any> {
        const startTime = Date.now();
        const result = {
            documentId: preparation.documentId,
            success: false,
            signatures: [] as any[],
            processingTime: 0,
            errors: [] as any[]
        };

        try {
            let document = preparation.pdfDocument;

            // Apply signatures sequentially or in parallel based on options
            if (options?.parallelSigning) {
                // Parallel signature application (for independent signatures)
                const signaturePromises = preparation.signatures.map(async (sigInfo, index) => {
                    return await this.applySignatureToDocument(
                        document,
                        sigInfo,
                        `${preparation.documentId}_sig_${index}`
                    );
                });

                const signatureResults = await Promise.allSettled(signaturePromises);

                for (let i = 0; i < signatureResults.length; i++) {
                    const sigResult = signatureResults[i];
                    if (sigResult.status === 'fulfilled') {
                        result.signatures.push(sigResult.value);
                    } else {
                        result.errors.push({
                            type: 'signature_application',
                            signatureIndex: i,
                            message: sigResult.reason?.message || 'Signature application failed',
                            timestamp: new Date(),
                            recoverable: true
                        });
                    }
                }
            } else {
                // Sequential signature application (default)
                for (let i = 0; i < preparation.signatures.length; i++) {
                    const sigInfo = preparation.signatures[i];

                    try {
                        const signatureResult = await this.applySignatureToDocument(
                            document,
                            sigInfo,
                            `${preparation.documentId}_sig_${i}`
                        );

                        result.signatures.push(signatureResult);
                        document = signatureResult.signedDocument;

                        // Update progress
                        const progress = Math.round(((i + 1) / preparation.signatures.length) * 100);
                        this.updateDocumentProgress(batchId, preparation.documentId, {
                            progress,
                            signatures: result.signatures
                        });

                    } catch (error) {
                        result.errors.push({
                            type: 'signature_application',
                            signatureIndex: i,
                            message: error instanceof Error ? error.message : 'Unknown error',
                            timestamp: new Date(),
                            recoverable: true
                        });

                        if (!options?.continueOnError) {
                            break;
                        }
                    }
                }
            }

            result.success = result.signatures.length > 0 && result.errors.length === 0;
            result.processingTime = Date.now() - startTime;

            return result;

        } catch (error) {
            result.errors.push({
                type: 'document_processing',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                recoverable: false,
                code: 'DOC_PROCESSING_ERROR',
                name: 'DocumentProcessingError'
            });
            result.processingTime = Date.now() - startTime;

            return result;
        }
    }

    /**
     * Apply a signature to a document
     */
    private async applySignatureToDocument(
        document: PDFDocument,
        signatureInfo: any,
        signatureId: string
    ): Promise<any> {
        try {
            // Create signature field if it doesn't exist
            const field = await this.pdfEngine.createField(document, {
                type: 'signature',
                name: signatureInfo.fieldName || signatureId,
                page: signatureInfo.page,
                x: signatureInfo.x,
                y: signatureInfo.y,
                width: signatureInfo.width,
                height: signatureInfo.height,
                required: false,
                readonly: false,
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
                alignment: 'left' as const,
                multiline: false
            });

            // Apply signature appearance if provided
            if (signatureInfo.appearance) {
                await this.appearanceEngine.generateSignatureAppearance(
                    document,
                    signatureInfo.appearance,
                    {
                        signerName: signatureInfo.signerName,
                        signingTime: new Date(),
                        reason: signatureInfo.reason,
                        location: signatureInfo.location
                    }
                );
            }

            // Create digital signature if certificate is provided
            let signature: CMSSignature | undefined;
            if (signatureInfo.certificate && signatureInfo.privateKey) {
                const documentBuffer = Buffer.from(await document.save());
                signature = await this.signatureEngine.createSignature(
                    documentBuffer,
                    signatureInfo.certificate,
                    signatureInfo.privateKey
                );

                // Add signature to document
                document = await this.signatureEngine.addSignatureToDocument(
                    document,
                    signature,
                    {
                        name: signatureInfo.fieldName || signatureId,
                        page: signatureInfo.page,
                        x: signatureInfo.x,
                        y: signatureInfo.y,
                        width: signatureInfo.width,
                        height: signatureInfo.height,
                        reason: signatureInfo.reason,
                        location: signatureInfo.location,
                        contactInfo: signatureInfo.contactInfo
                    }
                );
            }

            return {
                signatureId,
                fieldName: signatureInfo.fieldName || signatureId,
                success: true,
                signedDocument: document,
                signature,
                timestamp: new Date()
            };

        } catch (error) {
            throw new Error(`Failed to apply signature ${signatureId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validate signature fields in a document
     */
    private async validateSignatureFields(
        document: PDFDocument,
        signatures: any[]
    ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            const pageCount = document.getPageCount();

            for (const sig of signatures) {
                // Validate page number
                if (sig.page < 0 || sig.page >= pageCount) {
                    errors.push(`Invalid page number ${sig.page} for signature field`);
                }

                // Validate coordinates
                if (sig.x < 0 || sig.y < 0 || sig.width <= 0 || sig.height <= 0) {
                    errors.push(`Invalid coordinates for signature field on page ${sig.page}`);
                }

                // Validate field name uniqueness
                const existingFields = await this.pdfEngine.getFormFields(document);
                const fieldName = sig.fieldName || `signature_${sig.page}_${sig.x}_${sig.y}`;
                if (existingFields.some(field => field.getName() === fieldName)) {
                    warnings.push(`Field name '${fieldName}' already exists`);
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };

        } catch (error) {
            errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { isValid: false, errors, warnings };
        }
    }

    /**
     * Process document signing job (for job queue processing)
     */
    private async processDocumentSigningJob(payload: any): Promise<any> {
        const { batchId, document, options } = payload;

        try {
            // Prepare single document
            const preparation = await this.prepareBatchDocuments(batchId, [document], options);

            // Process signing
            const result = await this.processDocumentSigning(batchId, preparation[0], document, options);

            // Update batch progress
            const progress = this.activeBatches.get(batchId);
            if (progress) {
                progress.processedDocuments++;
                if (result.success) {
                    progress.successfulDocuments++;
                } else {
                    progress.failedDocuments++;
                    progress.errors.push(...result.errors);
                }

                this.emit('documentProcessed', { batchId, documentId: document.documentId, result });
            }

            return { success: true, data: result };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Update batch progress with error
            const progress = this.activeBatches.get(batchId);
            if (progress) {
                progress.processedDocuments++;
                progress.failedDocuments++;
                progress.errors.push({
                    type: 'job_processing',
                    documentId: document.documentId,
                    message: errorMessage,
                    timestamp: new Date(),
                    recoverable: false,
                    code: 'JOB_PROCESSING_ERROR',
                    name: 'JobProcessingError'
                });
            }

            return { success: false, error: errorMessage };
        }
    }

    /**
     * Monitor batch jobs progress
     */
    private async monitorBatchJobs(
        batchId: string,
        jobIds: string[],
        totalDocuments: number
    ): Promise<BatchSigningResult> {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(async () => {
                try {
                    const jobStatuses = await Promise.all(
                        jobIds.map(id => this.jobService!.getJobStatus(id))
                    );

                    const completed = jobStatuses.filter((status: any) =>
                        status && ['completed', 'failed', 'cancelled'].includes(status.status)
                    ).length;

                    const successful = jobStatuses.filter((status: any) =>
                        status && status.status === 'completed'
                    ).length;

                    const failed = jobStatuses.filter((status: any) =>
                        status && ['failed', 'cancelled'].includes(status.status)
                    ).length;

                    // Update progress
                    this.updateBatchProgress(batchId, {
                        processedDocuments: completed,
                        successfulDocuments: successful,
                        failedDocuments: failed
                    });

                    // Check if all jobs are complete
                    if (completed === totalDocuments) {
                        clearInterval(checkInterval);

                        const result: BatchSigningResult = {
                            batchId,
                            success: failed === 0,
                            processedDocuments: [], // Would be populated from job results
                            totalDocuments,
                            successfulDocuments: successful,
                            failedDocuments: failed,
                            processingTime: Date.now() - this.batchMetrics.get(batchId)!.processingStartTime,
                            errors: [],
                            metrics: {
                                averageDocumentTime: 0,
                                throughputPerMinute: 0,
                                errorRate: (failed / totalDocuments) * 100
                            }
                        };

                        this.updateBatchProgress(batchId, {
                            status: failed === 0 ? 'completed' : successful === 0 ? 'failed' : 'partial',
                            completedAt: new Date()
                        });

                        resolve(result);
                    }

                } catch (error) {
                    clearInterval(checkInterval);
                    reject(error);
                }
            }, 1000); // Check every second

            // Timeout after 1 hour
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error('Batch processing timeout'));
            }, 3600000);
        });
    }

    /**
     * Get batch progress
     */
    async getBatchProgress(batchId: string): Promise<BatchSigningProgress | null> {
        return this.activeBatches.get(batchId) || null;
    }

    /**
     * Get batch report
     */
    async getBatchReport(batchId: string): Promise<BatchProgressReport | null> {
        const progress = this.activeBatches.get(batchId);
        const metrics = this.batchMetrics.get(batchId);

        if (!progress || !metrics) {
            return null;
        }

        return {
            batchId,
            status: progress.status,
            summary: {
                totalDocuments: progress.totalDocuments,
                processedDocuments: progress.processedDocuments,
                successfulDocuments: progress.successfulDocuments,
                failedDocuments: progress.failedDocuments,
                progressPercentage: Math.round((progress.processedDocuments / progress.totalDocuments) * 100)
            },
            timing: {
                startedAt: progress.startedAt,
                completedAt: progress.completedAt,
                estimatedCompletion: progress.estimatedCompletion,
                totalProcessingTime: metrics.totalProcessingTime,
                averageDocumentTime: metrics.averageDocumentTime
            },
            performance: {
                throughputPerMinute: metrics.throughputPerMinute,
                errorRate: metrics.errorRate,
                retryCount: metrics.retryCount
            },
            documents: progress.documents,
            errors: progress.errors
        };
    }

    /**
     * Cancel batch operation
     */
    async cancelBatch(batchId: string): Promise<boolean> {
        const progress = this.activeBatches.get(batchId);
        if (!progress || ['completed', 'failed', 'cancelled'].includes(progress.status)) {
            return false;
        }

        this.updateBatchProgress(batchId, {
            status: 'cancelled',
            completedAt: new Date()
        });

        this.emit('batchCancelled', { batchId });
        return true;
    }

    /**
     * Attempt error recovery for a failed document
     */
    private async attemptErrorRecovery(
        batchId: string,
        documentId: string,
        error: any
    ): Promise<void> {
        // Implementation would depend on error type
        // For now, just log the recovery attempt
        console.log(`Attempting error recovery for document ${documentId} in batch ${batchId}`);

        // Could implement strategies like:
        // - Retry with different settings
        // - Skip problematic signatures
        // - Use fallback processing methods
    }

    /**
     * Check if an error is recoverable
     */
    private isRecoverableError(error: any): boolean {
        // Define which errors can be recovered from
        const recoverableErrors = [
            'TIMEOUT_ERROR',
            'NETWORK_ERROR',
            'TEMPORARY_FAILURE'
        ];

        if (error instanceof BatchSigningError) {
            return recoverableErrors.includes(error.code);
        }

        return false;
    }

    /**
     * Estimate completion time based on document count
     */
    private estimateCompletionTime(documentCount: number): Date {
        // Rough estimate: 30 seconds per document
        const estimatedMs = documentCount * 30000;
        return new Date(Date.now() + estimatedMs);
    }

    /**
     * Update batch progress
     */
    private updateBatchProgress(batchId: string, updates: Partial<BatchSigningProgress>): void {
        const current = this.activeBatches.get(batchId);
        if (current) {
            Object.assign(current, updates);
            this.emit('progressUpdate', { batchId, progress: current });
        }
    }

    /**
     * Update document progress within a batch
     */
    private updateDocumentProgress(
        batchId: string,
        documentId: string,
        updates: Partial<BatchDocumentStatus>
    ): void {
        const progress = this.activeBatches.get(batchId);
        if (progress) {
            const docStatus = progress.documents.find(d => d.documentId === documentId);
            if (docStatus) {
                Object.assign(docStatus, updates);
                this.emit('documentProgressUpdate', { batchId, documentId, status: docStatus });
            }
        }
    }

    /**
     * Clean up completed batches
     */
    async cleanupBatch(batchId: string): Promise<void> {
        this.activeBatches.delete(batchId);
        this.batchMetrics.delete(batchId);
        this.emit('batchCleanedUp', { batchId });
    }

    /**
     * Get health status of the batch signing engine
     */
    async getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        activeBatches: number;
        totalProcessedDocuments: number;
        averageProcessingTime: number;
    }> {
        const activeBatchCount = this.activeBatches.size;
        const allMetrics = Array.from(this.batchMetrics.values());

        const totalProcessedDocuments = allMetrics.reduce(
            (sum, metrics) => sum + metrics.totalDocuments, 0
        );

        const averageProcessingTime = allMetrics.length > 0
            ? allMetrics.reduce((sum, metrics) => sum + metrics.averageDocumentTime, 0) / allMetrics.length
            : 0;

        const status = activeBatchCount > 100 ? 'degraded' :
            activeBatchCount > 500 ? 'unhealthy' : 'healthy';

        return {
            status,
            activeBatches: activeBatchCount,
            totalProcessedDocuments,
            averageProcessingTime
        };
    }
}

/**
 * Batch Signing Error class
 */
export class BatchSigningError extends Error {
    constructor(
        message: string,
        public code: string,
        public batchId?: string,
        public documentId?: string
    ) {
        super(message);
        this.name = 'BatchSigningError';
    }
}

/**
 * Factory function to create a batch signing engine
 */
export function createBatchSigningEngine(
    pdfEngine?: PDFEngine,
    signatureEngine?: DigitalSignatureEngineImpl,
    jobService?: JobService
): BatchSigningEngine {
    return new BatchSigningEngine(pdfEngine, signatureEngine, jobService);
}