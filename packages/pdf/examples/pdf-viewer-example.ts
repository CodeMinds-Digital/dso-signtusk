/**
 * PDF Viewer Engine Usage Examples
 * 
 * Demonstrates how to use the PDF Viewer Engine for browser-based PDF rendering
 * with interactive field highlighting, zoom controls, and mobile support.
 */

import { PDFDocument } from 'pdf-lib';
import {
    createPDFViewerEngine,
    ViewerConfig,
    FieldDefinition,
    NavigationEvent,
    FieldInteractionEvent,
    TouchGesture
} from '../src/pdf-viewer-engine';

async function basicViewerExample() {
    console.log('=== Basic PDF Viewer Example ===');

    // Create a sample PDF document
    const pdfDoc = await PDFDocument.create();
    const page1 = pdfDoc.addPage([612, 792]);
    const page2 = pdfDoc.addPage([612, 792]);

    // Define form fields
    const fields: FieldDefinition[] = [
        {
            type: 'signature',
            name: 'client_signature',
            page: 0,
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            required: true,
            readonly: false,
            fontSize: 12,
            fontColor: '#000000',
        },
        {
            type: 'text',
            name: 'client_name',
            page: 0,
            x: 100,
            y: 200,
            width: 150,
            height: 25,
            required: true,
            readonly: false,
            fontSize: 12,
            fontColor: '#000000',
        },
        {
            type: 'date',
            name: 'signature_date',
            page: 1,
            x: 300,
            y: 150,
            width: 120,
            height: 25,
            required: true,
            readonly: false,
            fontSize: 12,
            fontColor: '#000000',
        },
    ];

    // Create viewer with configuration
    const viewerConfig: ViewerConfig = {
        mode: 'continuous',
        initialZoom: 'page-width',
        highlightFields: true,
        enableTouchGestures: true,
        mobileOptimized: true,
        renderQuality: 'high',
    };

    const viewer = createPDFViewerEngine(viewerConfig);

    // Load document
    await viewer.loadDocument(pdfDoc, fields);

    console.log('Document loaded successfully');
    console.log('Total pages:', viewer.getViewportState().totalPages);
    console.log('Current page:', viewer.getViewportState().currentPage);

    // Get field positions
    const fieldPositions = viewer.getFieldPositions();
    console.log('Field positions:', fieldPositions);

    return viewer;
}

async function navigationExample() {
    console.log('\n=== Navigation Example ===');

    const viewer = await basicViewerExample();

    // Set up navigation event listener
    const unsubscribeNav = viewer.onNavigation((event: NavigationEvent) => {
        console.log(`Navigation event: ${event.type}`);
        console.log('Previous state:', event.previousState);
        console.log('Current state:', event.currentState);
    });

    // Navigate through pages
    console.log('Navigating to page 2...');
    viewer.goToPage(2);

    console.log('Going to next page...');
    viewer.nextPage(); // Should stay on page 2 (last page)

    console.log('Going to previous page...');
    viewer.previousPage(); // Should go to page 1

    // Test zoom operations
    console.log('Zooming in...');
    viewer.zoomIn(0.2);

    console.log('Zooming out...');
    viewer.zoomOut(0.1);

    console.log('Setting custom zoom...');
    viewer.setZoom(1.5);

    console.log('Setting fit-to-width zoom...');
    viewer.setZoom('page-width');

    // Test rotation
    console.log('Rotating 90 degrees...');
    viewer.rotate(90);

    console.log('Rotating back to 0 degrees...');
    viewer.rotate(-90);

    // Clean up
    unsubscribeNav();

    return viewer;
}

async function fieldInteractionExample() {
    console.log('\n=== Field Interaction Example ===');

    const viewer = await basicViewerExample();

    // Set up field interaction listener
    const unsubscribeField = viewer.onFieldInteraction((event: FieldInteractionEvent) => {
        console.log(`Field interaction: ${event.type}`);
        console.log('Field:', event.field.fieldName);
        console.log('Coordinates:', event.coordinates);
    });

    // Test field detection
    const fieldPositions = viewer.getFieldPositions();

    for (const field of fieldPositions) {
        console.log(`\nTesting field: ${field.fieldName}`);

        // Test center point detection
        const centerX = field.x + field.width / 2;
        const centerY = field.y + field.height / 2;

        const detectedField = viewer.getFieldAtCoordinates(centerX, centerY, field.pageNumber);
        console.log('Detected field at center:', detectedField?.fieldName);

        // Highlight field
        console.log('Highlighting field...');
        viewer.highlightField(field.fieldName);

        // Verify current page changed to field's page
        const currentPage = viewer.getViewportState().currentPage;
        console.log('Current page after highlight:', currentPage);
        console.log('Field page:', field.pageNumber);
    }

    // Test coordinate detection outside fields
    const outsideField = viewer.getFieldAtCoordinates(50, 50, 1);
    console.log('Field detected outside field areas:', outsideField);

    // Clean up
    unsubscribeField();

    return viewer;
}

async function touchGestureExample() {
    console.log('\n=== Touch Gesture Example ===');

    const viewer = await basicViewerExample();

    // Test various touch gestures
    const gestures: TouchGesture[] = [
        {
            type: 'pinch',
            startX: 300,
            startY: 400,
            endX: 350,
            endY: 450,
            scale: 1.5,
        },
        {
            type: 'double-tap',
            startX: 300,
            startY: 400,
            endX: 300,
            endY: 400,
        },
        {
            type: 'swipe',
            startX: 500,
            startY: 400,
            endX: 100,
            endY: 400,
            velocity: -2.0,
        },
        {
            type: 'pan',
            startX: 200,
            startY: 300,
            endX: 250,
            endY: 350,
        },
    ];

    for (const gesture of gestures) {
        console.log(`\nProcessing ${gesture.type} gesture...`);

        const stateBefore = viewer.getViewportState();
        console.log('State before:', {
            page: stateBefore.currentPage,
            zoom: stateBefore.zoom,
        });

        viewer.handleTouchGesture(gesture);

        const stateAfter = viewer.getViewportState();
        console.log('State after:', {
            page: stateAfter.currentPage,
            zoom: stateAfter.zoom,
        });
    }

    return viewer;
}

async function mobileOptimizationExample() {
    console.log('\n=== Mobile Optimization Example ===');

    // Create mobile-optimized viewer
    const mobileConfig: ViewerConfig = {
        mode: 'single', // Better for mobile
        initialZoom: 'page-width',
        highlightFields: true,
        enableTouchGestures: true,
        mobileOptimized: true,
        touchScrollSensitivity: 1.2,
        pinchZoomSensitivity: 1.1,
        renderQuality: 'medium', // Balance quality and performance
        lazyLoadPages: true,
        cacheRenderedPages: true,
        maxCachedPages: 5, // Limit cache for mobile
    };

    const viewer = createPDFViewerEngine(mobileConfig);

    // Create a document with multiple pages
    const pdfDoc = await PDFDocument.create();
    for (let i = 0; i < 5; i++) {
        pdfDoc.addPage([612, 792]);
    }

    // Add fields across pages
    const fields: FieldDefinition[] = [];
    for (let page = 0; page < 5; page++) {
        fields.push({
            type: 'signature',
            name: `signature_page_${page + 1}`,
            page,
            x: 100 + (page * 20),
            y: 100 + (page * 30),
            width: 180,
            height: 40,
            required: true,
            readonly: false,
            fontSize: 12,
            fontColor: '#000000',
        });
    }

    await viewer.loadDocument(pdfDoc, fields);

    console.log('Mobile-optimized viewer loaded');
    console.log('Configuration:', mobileConfig);

    // Test mobile-specific gestures
    const mobileGestures: TouchGesture[] = [
        // Pinch to zoom
        {
            type: 'pinch',
            startX: 200,
            startY: 300,
            endX: 250,
            endY: 350,
            scale: 2.0,
        },
        // Swipe to navigate
        {
            type: 'swipe',
            startX: 400,
            startY: 300,
            endX: 100,
            endY: 300,
            velocity: -1.5,
        },
        // Double tap to zoom
        {
            type: 'double-tap',
            startX: 300,
            startY: 400,
            endX: 300,
            endY: 400,
        },
    ];

    for (const gesture of mobileGestures) {
        console.log(`Mobile gesture: ${gesture.type}`);
        viewer.handleTouchGesture(gesture);

        const state = viewer.getViewportState();
        console.log(`Page: ${state.currentPage}, Zoom: ${state.zoom}`);
    }

    return viewer;
}

async function performanceExample() {
    console.log('\n=== Performance Example ===');

    // Create performance-optimized viewer
    const performanceConfig: ViewerConfig = {
        mode: 'continuous',
        initialZoom: 'page-fit',
        renderQuality: 'high',
        lazyLoadPages: true,
        cacheRenderedPages: true,
        maxCachedPages: 20,
    };

    const viewer = createPDFViewerEngine(performanceConfig);

    // Create a large document
    const pdfDoc = await PDFDocument.create();
    const pageCount = 10;

    for (let i = 0; i < pageCount; i++) {
        pdfDoc.addPage([612, 792]);
    }

    // Add many fields
    const fields: FieldDefinition[] = [];
    for (let page = 0; page < pageCount; page++) {
        for (let field = 0; field < 5; field++) {
            fields.push({
                type: field % 2 === 0 ? 'text' : 'signature',
                name: `field_${page}_${field}`,
                page,
                x: 50 + (field * 100),
                y: 100 + (field * 50),
                width: 80,
                height: 30,
                required: false,
                readonly: false,
                fontSize: 10,
                fontColor: '#000000',
            });
        }
    }

    console.log(`Loading document with ${pageCount} pages and ${fields.length} fields...`);

    const startTime = Date.now();
    await viewer.loadDocument(pdfDoc, fields);
    const loadTime = Date.now() - startTime;

    console.log(`Document loaded in ${loadTime}ms`);

    // Test rendering performance
    const renderStartTime = Date.now();

    for (let page = 1; page <= Math.min(5, pageCount); page++) {
        const pageStartTime = Date.now();
        await viewer.renderPage(page);
        const pageTime = Date.now() - pageStartTime;
        console.log(`Page ${page} rendered in ${pageTime}ms`);
    }

    const totalRenderTime = Date.now() - renderStartTime;
    console.log(`Total render time: ${totalRenderTime}ms`);

    // Test field detection performance
    const detectionStartTime = Date.now();
    const fieldPositions = viewer.getFieldPositions();

    let detectionCount = 0;
    for (const field of fieldPositions.slice(0, 20)) { // Test first 20 fields
        const centerX = field.x + field.width / 2;
        const centerY = field.y + field.height / 2;

        const detected = viewer.getFieldAtCoordinates(centerX, centerY, field.pageNumber);
        if (detected) {
            detectionCount++;
        }
    }

    const detectionTime = Date.now() - detectionStartTime;
    console.log(`Field detection: ${detectionCount} fields detected in ${detectionTime}ms`);

    return viewer;
}

// Run all examples
async function runAllExamples() {
    try {
        await basicViewerExample();
        await navigationExample();
        await fieldInteractionExample();
        await touchGestureExample();
        await mobileOptimizationExample();
        await performanceExample();

        console.log('\n=== All PDF Viewer Examples Completed Successfully ===');
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Export for use in other files
export {
    basicViewerExample,
    navigationExample,
    fieldInteractionExample,
    touchGestureExample,
    mobileOptimizationExample,
    performanceExample,
    runAllExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples();
}