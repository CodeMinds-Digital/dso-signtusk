/**
 * PDF Optimization System Example
 * 
 * This example demonstrates how to use the comprehensive PDF optimization system
 * to compress PDFs, optimize images, subset fonts, and improve performance.
 */

import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
    PDFOptimizationEngine,
    createPDFOptimizationEngine,
    type OptimizationOptions,
    type IncrementalUpdateOptions,
} from '../src';

async function main() {
    console.log('PDF Optimization System Example\n');

    // Example 1: Basic PDF Optimization
    console.log('Example 1: Basic PDF Optimization');
    console.log('-----------------------------------');
    await basicOptimization();

    // Example 2: Custom Optimization Options
    console.log('\nExample 2: Custom Optimization Options');
    console.log('---------------------------------------');
    await customOptimization();

    // Example 3: Analyze Optimization Opportunities
    console.log('\nExample 3: Analyze Optimization Opportunities');
    console.log('----------------------------------------------');
    await analyzeOptimization();

    // Example 4: Incremental Updates
    console.log('\nExample 4: Incremental Updates');
    console.log('-------------------------------');
    await incrementalOptimization();

    // Example 5: Comprehensive Optimization Pipeline
    console.log('\nExample 5: Comprehensive Optimization Pipeline');
    console.log('-----------------------------------------------');
    await comprehensiveOptimization();
}

/**
 * Example 1: Basic PDF Optimization
 * Demonstrates simple PDF optimization with default settings
 */
async function basicOptimization() {
    try {
        // Load a PDF document
        const pdfBuffer = readFileSync(join(__dirname, '../../../assets/example.pdf'));
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        console.log(`Original document: ${pdfDoc.getPageCount()} pages`);
        console.log(`Original size: ${pdfBuffer.length} bytes`);

        // Create optimization engine with default options
        const optimizer = createPDFOptimizationEngine();

        // Optimize the PDF
        const { document: optimizedDoc, result } = await optimizer.optimizePDF(pdfDoc);

        console.log('\nOptimization Results:');
        console.log(`- Success: ${result.success}`);
        console.log(`- Original Size: ${result.compressionStats.originalSize} bytes`);
        console.log(`- Optimized Size: ${result.compressionStats.optimizedSize} bytes`);
        console.log(`- Space Saved: ${result.compressionStats.spaceSaved} bytes`);
        console.log(`- Compression: ${result.compressionStats.compressionPercentage.toFixed(2)}%`);
        console.log(`- Processing Time: ${result.processingTime}ms`);
        console.log(`- Optimizations Applied: ${result.optimizationsApplied.join(', ')}`);

        // Save the optimized PDF
        const optimizedBytes = await optimizedDoc.save();
        writeFileSync(join(__dirname, 'output/optimized-basic.pdf'), optimizedBytes);
        console.log('\nOptimized PDF saved to: output/optimized-basic.pdf');

    } catch (error) {
        console.error('Error in basic optimization:', error);
    }
}

/**
 * Example 2: Custom Optimization Options
 * Demonstrates PDF optimization with custom settings
 */
async function customOptimization() {
    try {
        const pdfBuffer = readFileSync(join(__dirname, '../../../assets/example.pdf'));
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        // Define custom optimization options
        const options: OptimizationOptions = {
            compressImages: true,
            removeUnusedObjects: true,
            optimizeFonts: true,
            linearize: true, // Enable linearization for faster web viewing
            quality: 75, // Lower quality for more compression
        };

        console.log('Custom Optimization Options:');
        console.log(`- Compress Images: ${options.compressImages}`);
        console.log(`- Remove Unused Objects: ${options.removeUnusedObjects}`);
        console.log(`- Optimize Fonts: ${options.optimizeFonts}`);
        console.log(`- Linearize: ${options.linearize}`);
        console.log(`- Quality: ${options.quality}%`);

        const optimizer = createPDFOptimizationEngine(options);
        const { document: optimizedDoc, result } = await optimizer.optimizePDF(pdfDoc);

        console.log('\nOptimization Results:');
        console.log(`- Compression: ${result.compressionStats.compressionPercentage.toFixed(2)}%`);
        console.log(`- Pages Optimized: ${result.pageOptimizations.length}`);

        if (result.fontOptimization) {
            console.log(`- Fonts Processed: ${result.fontOptimization.fontsProcessed}`);
            console.log(`- Font Subset Count: ${result.fontOptimization.subsetFonts.length}`);
        }

        console.log(`- Removed Objects: ${result.removedObjectsCount}`);

        // Save the optimized PDF
        const optimizedBytes = await optimizedDoc.save();
        writeFileSync(join(__dirname, 'output/optimized-custom.pdf'), optimizedBytes);
        console.log('\nOptimized PDF saved to: output/optimized-custom.pdf');

    } catch (error) {
        console.error('Error in custom optimization:', error);
    }
}

/**
 * Example 3: Analyze Optimization Opportunities
 * Demonstrates analyzing a PDF for optimization opportunities before optimizing
 */
async function analyzeOptimization() {
    try {
        const pdfBuffer = readFileSync(join(__dirname, '../../../assets/example.pdf'));
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        const optimizer = createPDFOptimizationEngine();

        // Analyze the document first
        const analysis = await optimizer.analyzeOptimizationOpportunities(pdfDoc);

        console.log('Optimization Analysis:');
        console.log(`- Estimated Savings: ${analysis.estimatedSavings} bytes`);
        console.log('\nRecommendations:');
        analysis.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });

        console.log('\nDetailed Analysis:');
        console.log('Images:');
        console.log(`  - Can Optimize: ${analysis.analysisDetails.images.canOptimize}`);
        console.log(`  - Image Count: ${analysis.analysisDetails.images.imageCount}`);
        console.log(`  - Estimated Savings: ${analysis.analysisDetails.images.estimatedSavings} bytes`);

        console.log('Fonts:');
        console.log(`  - Can Optimize: ${analysis.analysisDetails.fonts.canOptimize}`);
        console.log(`  - Font Count: ${analysis.analysisDetails.fonts.fontCount}`);
        console.log(`  - Estimated Savings: ${analysis.analysisDetails.fonts.estimatedSavings} bytes`);

        console.log('Structure:');
        console.log(`  - Has Unused Objects: ${analysis.analysisDetails.structure.hasUnusedObjects}`);
        console.log(`  - Estimated Savings: ${analysis.analysisDetails.structure.estimatedSavings} bytes`);

        // Now optimize based on the analysis
        if (analysis.estimatedSavings > 10000) { // If we can save more than 10KB
            console.log('\nProceeding with optimization...');
            const { document: optimizedDoc, result } = await optimizer.optimizePDF(pdfDoc);
            console.log(`Actual savings: ${result.compressionStats.spaceSaved} bytes`);
        } else {
            console.log('\nOptimization not recommended - minimal savings expected');
        }

    } catch (error) {
        console.error('Error in optimization analysis:', error);
    }
}

/**
 * Example 4: Incremental Updates
 * Demonstrates using incremental updates for better performance
 */
async function incrementalOptimization() {
    try {
        const pdfBuffer = readFileSync(join(__dirname, '../../../assets/example.pdf'));
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        const optimizer = createPDFOptimizationEngine();

        // Use incremental updates for large documents
        const incrementalOptions: IncrementalUpdateOptions = {
            preserveOriginalStructure: true,
            minimizeChanges: true,
            compressUpdates: true,
        };

        console.log('Incremental Update Options:');
        console.log(`- Preserve Original Structure: ${incrementalOptions.preserveOriginalStructure}`);
        console.log(`- Minimize Changes: ${incrementalOptions.minimizeChanges}`);
        console.log(`- Compress Updates: ${incrementalOptions.compressUpdates}`);

        const { document: optimizedDoc, updateInfo } = await optimizer.optimizeWithIncrementalUpdates(
            pdfDoc,
            incrementalOptions
        );

        console.log('\nIncremental Update Results:');
        console.log(`- Pages Modified: ${updateInfo.pagesModified}`);
        console.log(`- Incremental Updates: ${updateInfo.incrementalUpdates}`);
        console.log(`- Structure Preserved: ${updateInfo.preservedStructure}`);
        console.log(`- Compression Applied: ${updateInfo.compressionApplied}`);

        // Save the optimized PDF
        const optimizedBytes = await optimizedDoc.save();
        writeFileSync(join(__dirname, 'output/optimized-incremental.pdf'), optimizedBytes);
        console.log('\nOptimized PDF saved to: output/optimized-incremental.pdf');

    } catch (error) {
        console.error('Error in incremental optimization:', error);
    }
}

/**
 * Example 5: Comprehensive Optimization Pipeline
 * Demonstrates a complete optimization workflow with analysis, optimization, and validation
 */
async function comprehensiveOptimization() {
    try {
        const pdfBuffer = readFileSync(join(__dirname, '../../../assets/example.pdf'));
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        console.log('Starting Comprehensive Optimization Pipeline...\n');

        // Step 1: Analyze
        console.log('Step 1: Analyzing document...');
        const optimizer = createPDFOptimizationEngine();
        const analysis = await optimizer.analyzeOptimizationOpportunities(pdfDoc);
        console.log(`- Found ${analysis.recommendations.length} optimization opportunities`);
        console.log(`- Estimated savings: ${analysis.estimatedSavings} bytes`);

        // Step 2: Choose optimization strategy based on analysis
        console.log('\nStep 2: Determining optimization strategy...');
        const options: OptimizationOptions = {
            compressImages: analysis.analysisDetails.images.canOptimize,
            removeUnusedObjects: analysis.analysisDetails.structure.hasUnusedObjects,
            optimizeFonts: analysis.analysisDetails.fonts.canOptimize,
            linearize: pdfDoc.getPageCount() > 10, // Linearize for documents with many pages
            quality: 85,
        };
        console.log('- Strategy determined based on analysis');

        // Step 3: Optimize
        console.log('\nStep 3: Optimizing document...');
        const startTime = Date.now();
        const { document: optimizedDoc, result } = await optimizer.optimizePDF(pdfDoc, options);
        const optimizationTime = Date.now() - startTime;
        console.log(`- Optimization completed in ${optimizationTime}ms`);

        // Step 4: Report results
        console.log('\nStep 4: Optimization Results:');
        console.log(`- Original Size: ${result.compressionStats.originalSize} bytes`);
        console.log(`- Optimized Size: ${result.compressionStats.optimizedSize} bytes`);
        console.log(`- Space Saved: ${result.compressionStats.spaceSaved} bytes`);
        console.log(`- Compression Ratio: ${(result.compressionStats.compressionRatio * 100).toFixed(2)}%`);
        console.log(`- Optimizations Applied: ${result.optimizationsApplied.join(', ')}`);

        if (result.pageOptimizations.length > 0) {
            const totalImagesProcessed = result.pageOptimizations.reduce(
                (sum, page) => sum + page.imagesProcessed,
                0
            );
            console.log(`- Total Images Processed: ${totalImagesProcessed}`);
        }

        if (result.fontOptimization) {
            console.log(`- Fonts Optimized: ${result.fontOptimization.fontsProcessed}`);
            console.log(`- Font Subsets Created: ${result.fontOptimization.subsetFonts.length}`);
        }

        // Step 5: Save
        console.log('\nStep 5: Saving optimized document...');
        const optimizedBytes = await optimizedDoc.save();
        writeFileSync(join(__dirname, 'output/optimized-comprehensive.pdf'), optimizedBytes);
        console.log('- Optimized PDF saved to: output/optimized-comprehensive.pdf');

        // Step 6: Verify
        console.log('\nStep 6: Verifying optimization...');
        const verifyDoc = await PDFDocument.load(optimizedBytes);
        console.log(`- Page count preserved: ${verifyDoc.getPageCount() === pdfDoc.getPageCount()}`);
        console.log(`- Metadata preserved: ${verifyDoc.getTitle() === pdfDoc.getTitle()}`);
        console.log('- Verification complete');

        console.log('\n✓ Comprehensive optimization pipeline completed successfully!');

    } catch (error) {
        console.error('Error in comprehensive optimization:', error);
    }
}

// Run the examples
main().catch(console.error);