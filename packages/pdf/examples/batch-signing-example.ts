import { PDFDocument } from 'pdf-lib';
import { createBatchSigningEngine } from '../src/batch-signing-engine';
import { PDFEngine } from '../src/pdf-engine';
import { DigitalSignatureEngineImpl } from '../src/digital-signature-engine';
import { InMemoryJobService } from '@signtusk/jobs';
import type { BatchSigningRequest } from '../src/types';

/**
 * Example: Batch Signing System Usage
 * 
 * This example demonstrates how to use the batch signing system to process
 * multiple documents with signatures efficiently, including progress tracking
 * and error handling.
 */

async function batchSigningExample() {
    console.log('🚀 Starting Batch Signing Example');

    // Initialize the batch signing engine
    const pdfEngine = new PDFEngine();
    const signatureEngine = new DigitalSignatureEngineImpl();
    const jobService = new InMemoryJobService();

    const batchEngine = createBatchSigningEngine(pdfEngine, signatureEngine, jobService);

    // Set up event listeners for progress tracking
    batchEngine.on('batchStarted', ({ batchId, progress }) => {
        console.log(`📋 Batch ${batchId} started with ${progress.totalDocuments} documents`);
    });

    batchEngine.on('documentProcessed', ({ batchId, documentId, result }) => {
        console.log(`📄 Document ${documentId} processed: ${result.success ? '✅ Success' : '❌ Failed'}`);
    });

    batchEngine.on('progressUpdate', ({ batchId, progress }) => {
        if (progress.processedDocuments !== undefined) {
            const percent = Math.round((progress.processedDocuments / progress.totalDocuments) * 100);
            console.log(`📊 Batch ${batchId} progress: ${percent}%`);
        }
    });

    batchEngine.on('batchCompleted', ({ batchId, result }) => {
        console.log(`🎉 Batch ${batchId} completed: ${result.successfulDocuments}/${result.totalDocuments} successful`);
    });

    try {
        // Example 1: Simple batch signing with multiple documents
        console.log('\n📝 Example 1: Simple Batch Signing');

        const documents = await createSampleDocuments(3);

        const simpleBatchRequest: BatchSigningRequest = {
            documents: documents.map((doc, index) => ({
                documentId: `contract-${index + 1}`,
                documentBuffer: doc,
                signatures: [
                    {
                        page: 0,
                        x: 100,
                        y: 700,
                        width: 200,
                        height: 50,
                        signerName: `Signer ${index + 1}`,
                        reason: 'Contract approval',
                        location: 'New York, NY'
                    }
                ]
            })),
            options: {
                useJobQueue: false,
                parallelSigning: false,
                optimizeDocuments: true
            }
        };

        const simpleResult = await batchEngine.startBatchSigning(simpleBatchRequest);
        console.log(`✅ Simple batch completed: ${simpleResult.successfulDocuments}/${simpleResult.totalDocuments} documents signed`);
        console.log(`⏱️  Processing time: ${simpleResult.processingTime}ms`);
        console.log(`📈 Throughput: ${simpleResult.metrics.throughputPerMinute.toFixed(2)} docs/min`);

        // Example 2: Complex batch with multiple signatures per document
        console.log('\n📝 Example 2: Complex Batch with Multiple Signatures');

        const complexDocuments = await createSampleDocuments(2);

        const complexBatchRequest: BatchSigningRequest = {
            documents: complexDocuments.map((doc, index) => ({
                documentId: `agreement-${index + 1}`,
                documentBuffer: doc,
                signatures: [
                    {
                        fieldName: `client_signature_${index + 1}`,
                        page: 0,
                        x: 100,
                        y: 700,
                        width: 200,
                        height: 50,
                        signerName: `Client ${index + 1}`,
                        reason: 'Client approval',
                        location: 'Client Office'
                    },
                    {
                        fieldName: `manager_signature_${index + 1}`,
                        page: 0,
                        x: 350,
                        y: 700,
                        width: 200,
                        height: 50,
                        signerName: `Manager ${index + 1}`,
                        reason: 'Management approval',
                        location: 'Corporate Office'
                    },
                    {
                        fieldName: `witness_signature_${index + 1}`,
                        page: 0,
                        x: 100,
                        y: 600,
                        width: 200,
                        height: 50,
                        signerName: `Witness ${index + 1}`,
                        reason: 'Witness verification',
                        location: 'Notary Office'
                    }
                ]
            })),
            options: {
                useJobQueue: false,
                parallelSigning: true, // Process signatures in parallel
                optimizeDocuments: true,
                continueOnError: true
            }
        };

        const complexResult = await batchEngine.startBatchSigning(complexBatchRequest);
        console.log(`✅ Complex batch completed: ${complexResult.successfulDocuments}/${complexResult.totalDocuments} documents signed`);

        // Get detailed report
        const report = await batchEngine.getBatchReport(complexResult.batchId);
        if (report) {
            console.log(`📊 Batch Report:`);
            console.log(`   - Total signatures applied: ${report.documents.reduce((sum, doc) => sum + doc.signatures.length, 0)}`);
            console.log(`   - Average document time: ${report.timing.averageDocumentTime.toFixed(2)}ms`);
            console.log(`   - Error rate: ${report.performance.errorRate.toFixed(2)}%`);
        }

        // Example 3: Batch processing with job queue (asynchronous)
        console.log('\n📝 Example 3: Asynchronous Batch Processing with Job Queue');

        await jobService.start();

        const asyncDocuments = await createSampleDocuments(5);

        const asyncBatchRequest: BatchSigningRequest = {
            documents: asyncDocuments.map((doc, index) => ({
                documentId: `async-doc-${index + 1}`,
                documentBuffer: doc,
                signatures: [
                    {
                        page: 0,
                        x: 100,
                        y: 700,
                        width: 200,
                        height: 50,
                        signerName: `Async Signer ${index + 1}`,
                        reason: 'Async processing test'
                    }
                ]
            })),
            options: {
                useJobQueue: true,
                concurrency: 3,
                maxRetries: 2,
                timeout: 60000
            }
        };

        const asyncResult = await batchEngine.startBatchSigning(asyncBatchRequest);
        console.log(`🔄 Async batch started: ${asyncResult.batchId}`);

        // Monitor progress
        let completed = false;
        const progressInterval = setInterval(async () => {
            const progress = await batchEngine.getBatchProgress(asyncResult.batchId);
            if (progress) {
                const percent = Math.round((progress.processedDocuments / progress.totalDocuments) * 100);
                console.log(`📊 Async batch progress: ${percent}% (${progress.processedDocuments}/${progress.totalDocuments})`);

                if (progress.status === 'completed' || progress.status === 'failed') {
                    completed = true;
                    clearInterval(progressInterval);
                    console.log(`✅ Async batch ${progress.status}: ${progress.successfulDocuments}/${progress.totalDocuments} successful`);
                }
            }
        }, 2000);

        // Wait for completion (with timeout)
        let waitTime = 0;
        while (!completed && waitTime < 30000) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            waitTime += 1000;
        }

        if (!completed) {
            clearInterval(progressInterval);
            console.log('⏰ Async batch processing timeout - cancelling');
            await batchEngine.cancelBatch(asyncResult.batchId);
        }

        await jobService.stop();

        // Example 4: Error handling and recovery
        console.log('\n📝 Example 4: Error Handling and Recovery');

        const mixedDocuments = await createMixedDocuments(); // Some valid, some invalid

        const errorBatchRequest: BatchSigningRequest = {
            documents: mixedDocuments.map((doc, index) => ({
                documentId: `mixed-doc-${index + 1}`,
                documentBuffer: doc.buffer,
                signatures: doc.isValid ? [
                    {
                        page: 0,
                        x: 100,
                        y: 700,
                        width: 200,
                        height: 50,
                        signerName: `Test Signer ${index + 1}`,
                        reason: 'Error handling test'
                    }
                ] : [
                    {
                        page: 10, // Invalid page number
                        x: -100, // Invalid coordinates
                        y: -100,
                        width: 200,
                        height: 50,
                        signerName: `Invalid Signer ${index + 1}`,
                        reason: 'This should fail'
                    }
                ]
            })),
            options: {
                continueOnError: true,
                enableErrorRecovery: true,
                maxRetries: 2
            }
        };

        try {
            const errorResult = await batchEngine.startBatchSigning(errorBatchRequest);
            console.log(`⚠️  Mixed batch completed with errors: ${errorResult.successfulDocuments}/${errorResult.totalDocuments} successful`);
            console.log(`❌ Errors encountered: ${errorResult.errors.length}`);

            errorResult.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.type}: ${error.message}`);
            });
        } catch (error) {
            console.log(`❌ Batch failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Example 5: Health monitoring
        console.log('\n📝 Example 5: Health Monitoring');

        const health = await batchEngine.getHealthStatus();
        console.log(`🏥 Batch Engine Health:`);
        console.log(`   - Status: ${health.status}`);
        console.log(`   - Active batches: ${health.activeBatches}`);
        console.log(`   - Total processed documents: ${health.totalProcessedDocuments}`);
        console.log(`   - Average processing time: ${health.averageProcessingTime.toFixed(2)}ms`);

        console.log('\n🎉 Batch Signing Examples Completed Successfully!');

    } catch (error) {
        console.error('❌ Example failed:', error);
    }
}

/**
 * Create sample PDF documents for testing
 */
async function createSampleDocuments(count: number): Promise<Buffer[]> {
    const documents: Buffer[] = [];

    for (let i = 0; i < count; i++) {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // Standard letter size

        // Add some sample content
        const { width, height } = page.getSize();

        // Add title
        page.drawText(`Sample Document ${i + 1}`, {
            x: 50,
            y: height - 50,
            size: 20
        });

        // Add content
        page.drawText('This is a sample document for batch signing demonstration.', {
            x: 50,
            y: height - 100,
            size: 12
        });

        page.drawText('Please sign below:', {
            x: 50,
            y: height - 150,
            size: 12
        });

        // Add signature line
        page.drawLine({
            start: { x: 100, y: height - 200 },
            end: { x: 300, y: height - 200 },
            thickness: 1
        });

        page.drawText('Signature', {
            x: 100,
            y: height - 220,
            size: 10
        });

        const pdfBytes = await pdfDoc.save();
        documents.push(Buffer.from(pdfBytes));
    }

    return documents;
}

/**
 * Create mixed documents (some valid, some invalid) for error testing
 */
async function createMixedDocuments(): Promise<Array<{ buffer: Buffer; isValid: boolean }>> {
    const documents: Array<{ buffer: Buffer; isValid: boolean }> = [];

    // Add valid documents
    const validDocs = await createSampleDocuments(2);
    validDocs.forEach(doc => {
        documents.push({ buffer: doc, isValid: true });
    });

    // Add invalid documents
    documents.push({ buffer: Buffer.from('Invalid PDF content'), isValid: false });
    documents.push({ buffer: Buffer.from('Another invalid PDF'), isValid: false });

    return documents;
}

// Run the example
if (require.main === module) {
    batchSigningExample().catch(console.error);
}

export { batchSigningExample };