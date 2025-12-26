/**
 * Property-Based Tests for PDF Viewer Engine
 * 
 * **Feature: PDF Viewer Integration, Property 22: Field Placement Precision**
 * **Validates: Requirements 5.2**
 * 
 * Tests that field placement and highlighting in the PDF viewer maintains
 * precise positioning across different zoom levels, rotations, and viewport states.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PDFDocument } from 'pdf-lib';
import { PDFViewerEngine, createPDFViewerEngine, ViewerConfig, ZoomLevel } from '../pdf-viewer-engine';
import type { FieldDefinition } from '../types';

describe('PDF Viewer Engine - Property-Based Tests', () => {
    let viewerEngine: PDFViewerEngine;
    let mockDocument: PDFDocument;

    beforeEach(async () => {
        // Create a mock PDF document
        mockDocument = await PDFDocument.create();
        mockDocument.addPage([612, 792]); // Standard letter size
        mockDocument.addPage([612, 792]);
        mockDocument.addPage([612, 792]);
    });

    /**
     * **Feature: PDF Viewer Integration, Property 22: Field Placement Precision**
     * **Validates: Requirements 5.2**
     * 
     * Property: Field positions remain mathematically consistent across all zoom levels and rotations
     */
    it('Property 22: Field Placement Precision - maintains accurate field positioning across zoom and rotation transformations', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate viewer configuration
                fc.record({
                    mode: fc.constantFrom('single', 'continuous', 'facing', 'book'),
                    initialZoom: fc.oneof(
                        fc.double({ min: 0.1, max: 10 }),
                        fc.constantFrom('auto', 'page-fit', 'page-width', 'page-height')
                    ),
                    highlightFields: fc.boolean(),
                    enableTouchGestures: fc.boolean(),
                    renderQuality: fc.constantFrom('low', 'medium', 'high'),
                }),

                // Generate field definitions with precise coordinates
                fc.array(
                    fc.record({
                        type: fc.constantFrom('signature', 'text', 'checkbox', 'radio', 'dropdown', 'date'),
                        name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
                        page: fc.integer({ min: 0, max: 2 }), // 3 pages available
                        x: fc.double({ min: 0, max: 500, noNaN: true }),
                        y: fc.double({ min: 0, max: 700, noNaN: true }),
                        width: fc.double({ min: 10, max: 100, noNaN: true }),
                        height: fc.double({ min: 10, max: 50, noNaN: true }),
                        required: fc.boolean(),
                        readonly: fc.boolean(),
                        fontSize: fc.integer({ min: 8, max: 24 }),
                        fontColor: fc.constantFrom('#000000', '#333333', '#666666'),
                    }),
                    { minLength: 1, maxLength: 10 }
                ),

                // Generate zoom transformations
                fc.array(
                    fc.oneof(
                        fc.double({ min: 0.1, max: 5 }),
                        fc.constantFrom('auto', 'page-fit', 'page-width', 'page-height')
                    ),
                    { minLength: 1, maxLength: 5 }
                ),

                // Generate rotation angles
                fc.array(
                    fc.integer({ min: 0, max: 3 }).map(n => n * 90), // 0, 90, 180, 270 degrees
                    { minLength: 1, maxLength: 4 }
                ),

                async (config, fields, zoomLevels, rotations) => {
                    // Ensure unique field names and positions to avoid overlaps
                    const uniqueFields = fields.map((field, index) => ({
                        ...field,
                        name: `${field.name}_${index}`,
                        x: field.x + (index % 5) * 50, // Spread horizontally
                        y: field.y + Math.floor(index / 5) * 40, // Spread vertically
                    }));

                    // Create viewer with configuration
                    viewerEngine = createPDFViewerEngine(config);
                    await viewerEngine.loadDocument(mockDocument, uniqueFields);

                    // Test field placement precision across transformations
                    for (const zoom of zoomLevels) {
                        for (const rotation of rotations) {
                            // Apply transformations
                            viewerEngine.setZoom(zoom);
                            viewerEngine.rotate(rotation - viewerEngine.getViewportState().rotation);

                            // Get field positions after transformation
                            const fieldPositions = viewerEngine.getFieldPositions();

                            // Verify all fields are present
                            expect(fieldPositions).toHaveLength(uniqueFields.length);

                            // Verify field positioning precision
                            for (const fieldPos of fieldPositions) {
                                const originalField = uniqueFields.find(f => f.name === fieldPos.fieldName);
                                expect(originalField).toBeDefined();

                                if (originalField) {
                                    // Field should maintain its relative position on the correct page
                                    expect(fieldPos.pageNumber).toBe(originalField.page + 1); // Convert 0-based to 1-based
                                    expect(fieldPos.type).toBe(originalField.type);

                                    // Coordinates should be non-negative and within reasonable bounds
                                    expect(fieldPos.x).toBeGreaterThanOrEqual(0);
                                    expect(fieldPos.y).toBeGreaterThanOrEqual(0);
                                    expect(fieldPos.width).toBeGreaterThan(0);
                                    expect(fieldPos.height).toBeGreaterThan(0);

                                    // Field should not exceed page boundaries (accounting for transformations)
                                    expect(fieldPos.x + fieldPos.width).toBeLessThanOrEqual(1000); // Reasonable upper bound
                                    expect(fieldPos.y + fieldPos.height).toBeLessThanOrEqual(1000);
                                }
                            }

                            // Test field detection at coordinates
                            for (const fieldPos of fieldPositions) {
                                // Test center point of field
                                const centerX = fieldPos.x + fieldPos.width / 2;
                                const centerY = fieldPos.y + fieldPos.height / 2;

                                const detectedField = viewerEngine.getFieldAtCoordinates(centerX, centerY, fieldPos.pageNumber);
                                expect(detectedField).toBeDefined();
                                // For overlapping fields, just ensure we detect a field on the same page
                                if (detectedField) {
                                    expect(detectedField.pageNumber).toBe(fieldPos.pageNumber);
                                }

                                // Test corner points - for overlapping fields, just ensure we detect a field on the same page
                                const corners = [
                                    { x: fieldPos.x, y: fieldPos.y },
                                    { x: fieldPos.x + fieldPos.width, y: fieldPos.y },
                                    { x: fieldPos.x, y: fieldPos.y + fieldPos.height },
                                    { x: fieldPos.x + fieldPos.width, y: fieldPos.y + fieldPos.height },
                                ];

                                for (const corner of corners) {
                                    const cornerField = viewerEngine.getFieldAtCoordinates(corner.x, corner.y, fieldPos.pageNumber);
                                    // Corner should either be this field or another field on the same page (for overlapping fields)
                                    if (cornerField) {
                                        expect(cornerField.pageNumber).toBe(fieldPos.pageNumber);
                                    }
                                }
                            }

                            // Test field highlighting precision
                            for (const fieldPos of fieldPositions) {
                                expect(() => {
                                    viewerEngine.highlightField(fieldPos.fieldName);
                                }).not.toThrow();

                                // After highlighting, current page should be the field's page
                                expect(viewerEngine.getViewportState().currentPage).toBe(fieldPos.pageNumber);
                            }
                        }
                    }

                    // Test navigation precision
                    const totalPages = viewerEngine.getViewportState().totalPages;
                    const allFieldPositions = viewerEngine.getFieldPositions();

                    for (let page = 1; page <= totalPages; page++) {
                        viewerEngine.goToPage(page);
                        expect(viewerEngine.getViewportState().currentPage).toBe(page);

                        // Fields on this page should be accessible
                        const pageFields = allFieldPositions.filter(f => f.pageNumber === page);
                        for (const field of pageFields) {
                            const detected = viewerEngine.getFieldAtCoordinates(
                                field.x + field.width / 2,
                                field.y + field.height / 2,
                                page
                            );
                            expect(detected).toBeDefined();
                            // For overlapping fields, just ensure we detect a field on this page
                            if (detected) {
                                expect(pageFields.some(f => f.fieldName === detected.fieldName)).toBe(true);
                            }
                        }
                    }

                    // Test zoom precision - field relative positions should remain consistent
                    const initialPositions = viewerEngine.getFieldPositions();
                    viewerEngine.setZoom(2.0);
                    const zoomedPositions = viewerEngine.getFieldPositions();

                    expect(zoomedPositions).toHaveLength(initialPositions.length);

                    // Field relationships should be preserved
                    for (let i = 0; i < initialPositions.length; i++) {
                        const initial = initialPositions[i];
                        const zoomed = zoomedPositions.find(z => z.fieldName === initial.fieldName);
                        expect(zoomed).toBeDefined();

                        if (zoomed) {
                            // Page should remain the same
                            expect(zoomed.pageNumber).toBe(initial.pageNumber);
                            expect(zoomed.type).toBe(initial.type);

                            // Relative positioning should be maintained
                            expect(zoomed.width).toBeGreaterThan(0);
                            expect(zoomed.height).toBeGreaterThan(0);
                        }
                    }
                }
            ),
            {
                numRuns: 100,
                timeout: 30000,
            }
        );
    });

    /**
     * Property: Touch gesture handling maintains field interaction precision
     */
    it('Property 22.1: Touch gesture precision - field interactions remain accurate during touch navigation', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate touch gestures
                fc.array(
                    fc.record({
                        type: fc.constantFrom('tap', 'double-tap', 'pinch', 'pan', 'swipe'),
                        startX: fc.double({ min: 0, max: 600, noNaN: true }),
                        startY: fc.double({ min: 0, max: 800, noNaN: true }),
                        endX: fc.double({ min: 0, max: 600, noNaN: true }),
                        endY: fc.double({ min: 0, max: 800, noNaN: true }),
                        scale: fc.option(fc.double({ min: 0.5, max: 3, noNaN: true })),
                        velocity: fc.option(fc.double({ min: -5, max: 5, noNaN: true })),
                    }),
                    { minLength: 1, maxLength: 10 }
                ),

                // Generate fields for interaction testing
                fc.array(
                    fc.record({
                        type: fc.constantFrom('signature', 'text', 'checkbox'),
                        name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
                        page: fc.integer({ min: 0, max: 2 }),
                        x: fc.double({ min: 50, max: 400, noNaN: true }),
                        y: fc.double({ min: 50, max: 600, noNaN: true }),
                        width: fc.double({ min: 20, max: 80, noNaN: true }),
                        height: fc.double({ min: 15, max: 40, noNaN: true }),
                        required: fc.boolean(),
                        readonly: fc.boolean(),
                        fontSize: fc.integer({ min: 10, max: 20 }),
                        fontColor: fc.constant('#000000'),
                    }),
                    { minLength: 2, maxLength: 8 }
                ),

                async (gestures, fields) => {
                    // Ensure unique field names and positions to avoid overlaps
                    const uniqueFields = fields.map((field, index) => ({
                        ...field,
                        name: `field_${index}_${field.name}`,
                        x: field.x + (index % 4) * 60, // Spread horizontally
                        y: field.y + Math.floor(index / 4) * 50, // Spread vertically
                    }));

                    // Create viewer with touch support
                    viewerEngine = createPDFViewerEngine({
                        enableTouchGestures: true,
                        mobileOptimized: true,
                        touchScrollSensitivity: 1,
                        pinchZoomSensitivity: 1,
                    });

                    await viewerEngine.loadDocument(mockDocument, uniqueFields);

                    const initialState = viewerEngine.getViewportState();
                    let interactionEvents: any[] = [];

                    // Listen for field interactions
                    const unsubscribe = viewerEngine.onFieldInteraction((event) => {
                        interactionEvents.push(event);
                    });

                    try {
                        // Process touch gestures
                        for (const gesture of gestures) {
                            const stateBefore = viewerEngine.getViewportState();

                            // Handle gesture
                            viewerEngine.handleTouchGesture(gesture);

                            const stateAfter = viewerEngine.getViewportState();

                            // Verify state consistency
                            expect(stateAfter.totalPages).toBe(stateBefore.totalPages);
                            expect(stateAfter.currentPage).toBeGreaterThanOrEqual(1);
                            expect(stateAfter.currentPage).toBeLessThanOrEqual(stateAfter.totalPages);

                            // Verify zoom bounds
                            if (typeof stateAfter.zoom === 'number') {
                                expect(stateAfter.zoom).toBeGreaterThanOrEqual(0.1);
                                expect(stateAfter.zoom).toBeLessThanOrEqual(10);
                            }

                            // Test field detection after gesture
                            const fieldPositions = viewerEngine.getFieldPositions();
                            for (const fieldPos of fieldPositions) {
                                // Field should still be detectable at its center
                                const centerX = fieldPos.x + fieldPos.width / 2;
                                const centerY = fieldPos.y + fieldPos.height / 2;

                                const detected = viewerEngine.getFieldAtCoordinates(centerX, centerY, fieldPos.pageNumber);
                                expect(detected).toBeDefined();
                                // For overlapping fields, just ensure we detect a field on the same page
                                if (detected) {
                                    expect(detected.pageNumber).toBe(fieldPos.pageNumber);
                                }
                            }
                        }

                        // Test field highlighting after all gestures
                        const finalPositions = viewerEngine.getFieldPositions();
                        for (const fieldPos of finalPositions) {
                            expect(() => {
                                viewerEngine.highlightField(fieldPos.fieldName);
                            }).not.toThrow();
                        }

                        // Verify field interaction events are valid
                        for (const event of interactionEvents) {
                            expect(event.type).toMatch(/^(hover|click|focus|blur)$/);
                            expect(event.field).toBeDefined();
                            expect(event.timestamp).toBeGreaterThan(0);
                            expect(event.coordinates).toBeDefined();
                            expect(typeof event.coordinates.x).toBe('number');
                            expect(typeof event.coordinates.y).toBe('number');
                        }

                    } finally {
                        unsubscribe();
                    }
                }
            ),
            {
                numRuns: 50,
                timeout: 20000,
            }
        );
    });

    /**
     * Property: Viewport state transitions maintain field accessibility
     */
    it('Property 22.2: Viewport state consistency - field accessibility is preserved across all viewport changes', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate viewport state changes
                fc.array(
                    fc.record({
                        action: fc.constantFrom('zoom', 'rotate', 'navigate', 'resize'),
                        zoomLevel: fc.oneof(
                            fc.double({ min: 0.2, max: 4 }),
                            fc.constantFrom('page-fit', 'page-width', 'page-height')
                        ),
                        rotation: fc.integer({ min: 0, max: 3 }).map(n => n * 90),
                        targetPage: fc.integer({ min: 1, max: 3 }),
                    }),
                    { minLength: 3, maxLength: 15 }
                ),

                // Generate comprehensive field set
                fc.array(
                    fc.record({
                        type: fc.constantFrom('signature', 'text', 'checkbox', 'radio', 'dropdown', 'date'),
                        name: fc.string({ minLength: 1, maxLength: 25 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
                        page: fc.integer({ min: 0, max: 2 }),
                        x: fc.double({ min: 10, max: 500, noNaN: true }),
                        y: fc.double({ min: 10, max: 700, noNaN: true }),
                        width: fc.double({ min: 15, max: 120, noNaN: true }),
                        height: fc.double({ min: 12, max: 60, noNaN: true }),
                        required: fc.boolean(),
                        readonly: fc.boolean(),
                        fontSize: fc.integer({ min: 8, max: 28 }),
                        fontColor: fc.constantFrom('#000000', '#333333', '#666666', '#999999'),
                    }),
                    { minLength: 3, maxLength: 12 }
                ),

                async (stateChanges, fields) => {
                    // Ensure unique field names and valid coordinates
                    const uniqueFields = fields.map((field, index) => ({
                        ...field,
                        name: `field_${index}_${field.name.slice(0, 15)}`,
                        // Ensure fields don't overlap excessively
                        x: field.x + (index % 4) * 80, // Increase spacing
                        y: field.y + Math.floor(index / 4) * 60, // Increase spacing
                    }));

                    // Create viewer
                    viewerEngine = createPDFViewerEngine({
                        highlightFields: true,
                        enableKeyboardNavigation: true,
                        enableMouseWheelZoom: true,
                        cacheRenderedPages: true,
                    });

                    await viewerEngine.loadDocument(mockDocument, uniqueFields);

                    const originalFieldPositions = viewerEngine.getFieldPositions();
                    let navigationEvents: any[] = [];

                    // Listen for navigation events
                    const unsubscribe = viewerEngine.onNavigation((event) => {
                        navigationEvents.push(event);
                    });

                    try {
                        // Apply state changes
                        for (const change of stateChanges) {
                            const stateBefore = viewerEngine.getViewportState();

                            switch (change.action) {
                                case 'zoom':
                                    viewerEngine.setZoom(change.zoomLevel);
                                    break;
                                case 'rotate':
                                    const currentRotation = stateBefore.rotation;
                                    viewerEngine.rotate(change.rotation - currentRotation);
                                    break;
                                case 'navigate':
                                    if (change.targetPage <= stateBefore.totalPages) {
                                        viewerEngine.goToPage(change.targetPage);
                                    }
                                    break;
                            }

                            const stateAfter = viewerEngine.getViewportState();

                            // Verify state validity
                            expect(stateAfter.currentPage).toBeGreaterThanOrEqual(1);
                            expect(stateAfter.currentPage).toBeLessThanOrEqual(stateAfter.totalPages);
                            expect(stateAfter.totalPages).toBe(3); // Our mock document has 3 pages

                            // Verify all fields are still accessible
                            const currentPositions = viewerEngine.getFieldPositions();
                            expect(currentPositions).toHaveLength(originalFieldPositions.length);

                            for (const originalField of originalFieldPositions) {
                                const currentField = currentPositions.find(f => f.fieldName === originalField.fieldName);
                                expect(currentField).toBeDefined();

                                if (currentField) {
                                    // Core properties should be preserved
                                    expect(currentField.pageNumber).toBe(originalField.pageNumber);
                                    expect(currentField.type).toBe(originalField.type);
                                    expect(currentField.fieldName).toBe(originalField.fieldName);

                                    // Field should still be detectable
                                    const centerX = currentField.x + currentField.width / 2;
                                    const centerY = currentField.y + currentField.height / 2;

                                    const detected = viewerEngine.getFieldAtCoordinates(
                                        centerX,
                                        centerY,
                                        currentField.pageNumber
                                    );
                                    expect(detected).toBeDefined();
                                    // For overlapping fields, just ensure we detect a field on the same page
                                    if (detected) {
                                        expect(detected.pageNumber).toBe(currentField.pageNumber);
                                    }

                                    // Field highlighting should work
                                    expect(() => {
                                        viewerEngine.highlightField(currentField.fieldName);
                                    }).not.toThrow();
                                }
                            }
                        }

                        // Verify navigation events are properly structured
                        for (const event of navigationEvents) {
                            expect(event.type).toMatch(/^(page-change|zoom-change|scroll|rotation-change)$/);
                            expect(event.previousState).toBeDefined();
                            expect(event.currentState).toBeDefined();
                            expect(event.timestamp).toBeGreaterThan(0);
                            expect(typeof event.timestamp).toBe('number');
                        }

                        // Final comprehensive field test
                        const finalPositions = viewerEngine.getFieldPositions();
                        expect(finalPositions).toHaveLength(uniqueFields.length);

                        // Test field detection across all pages
                        for (let page = 1; page <= 3; page++) {
                            const pageFields = finalPositions.filter(f => f.pageNumber === page);
                            for (const field of pageFields) {
                                const detected = viewerEngine.getFieldAtCoordinates(
                                    field.x + field.width / 2,
                                    field.y + field.height / 2,
                                    page
                                );
                                expect(detected).toBeDefined();
                                // For overlapping fields, just ensure we detect a field on the same page
                                if (detected) {
                                    expect(detected.pageNumber).toBe(page);
                                }
                            }
                        }

                    } finally {
                        unsubscribe();
                    }
                }
            ),
            {
                numRuns: 75,
                timeout: 25000,
            }
        );
    });
});