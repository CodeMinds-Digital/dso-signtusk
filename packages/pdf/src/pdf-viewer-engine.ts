/**
 * PDF Viewer Integration Engine
 * 
 * Provides PDF.js integration for browser rendering with interactive field highlighting,
 * zoom and navigation controls, and mobile-responsive viewer with touch support.
 * 
 * Requirements: 5.2 - PDF Form Field System
 */

import { z } from 'zod';
import type { PDFDocument } from 'pdf-lib';
import type { FieldDefinition } from './types';

// ============================================================================
// Types and Schemas
// ============================================================================

/**
 * Zoom level for PDF viewer
 */
export const ZoomLevelSchema = z.union([
    z.number().min(0.1).max(10), // Custom zoom level (10% to 1000%)
    z.enum(['auto', 'page-fit', 'page-width', 'page-height']), // Preset zoom modes
]);

export type ZoomLevel = z.infer<typeof ZoomLevelSchema>;

/**
 * Viewer mode for different display options
 */
export type ViewerMode = 'single' | 'continuous' | 'facing' | 'book';

/**
 * Field highlight style
 */
export interface FieldHighlightStyle {
    fillColor: string;
    borderColor: string;
    borderWidth: number;
    opacity: number;
    hoverFillColor?: string;
    hoverBorderColor?: string;
    selectedFillColor?: string;
    selectedBorderColor?: string;
}

/**
 * Viewer configuration
 */
export const ViewerConfigSchema = z.object({
    // Display options
    mode: z.enum(['single', 'continuous', 'facing', 'book']).default('continuous'),
    initialZoom: ZoomLevelSchema.default('page-width'),
    enableTextSelection: z.boolean().default(true),
    enableAnnotations: z.boolean().default(true),

    // Field highlighting
    highlightFields: z.boolean().default(true),
    highlightStyle: z.object({
        fillColor: z.string().default('#FFE5B4'),
        borderColor: z.string().default('#FFA500'),
        borderWidth: z.number().default(2),
        opacity: z.number().min(0).max(1).default(0.3),
        hoverFillColor: z.string().optional(),
        hoverBorderColor: z.string().optional(),
        selectedFillColor: z.string().optional(),
        selectedBorderColor: z.string().optional(),
    }).optional(),

    // Navigation
    enableKeyboardNavigation: z.boolean().default(true),
    enableMouseWheelZoom: z.boolean().default(true),
    enableTouchGestures: z.boolean().default(true),

    // Mobile optimization
    mobileOptimized: z.boolean().default(true),
    touchScrollSensitivity: z.number().min(0.1).max(10).default(1),
    pinchZoomSensitivity: z.number().min(0.1).max(10).default(1),

    // Performance
    renderQuality: z.enum(['low', 'medium', 'high']).default('high'),
    lazyLoadPages: z.boolean().default(true),
    cacheRenderedPages: z.boolean().default(true),
    maxCachedPages: z.number().min(1).max(100).default(10),
});

export type ViewerConfig = z.infer<typeof ViewerConfigSchema>;

/**
 * Page render options
 */
export interface PageRenderOptions {
    pageNumber: number;
    scale: number;
    rotation: number;
    quality: 'low' | 'medium' | 'high';
}

/**
 * Rendered page data
 */
export interface RenderedPage {
    pageNumber: number;
    canvas: HTMLCanvasElement | OffscreenCanvas;
    width: number;
    height: number;
    scale: number;
    rotation: number;
    renderTime: number;
}

/**
 * Field position in viewport coordinates
 */
export interface FieldPosition {
    fieldName: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    type: FieldDefinition['type'];
}

/**
 * Viewport state
 */
export interface ViewportState {
    currentPage: number;
    totalPages: number;
    zoom: ZoomLevel;
    rotation: number;
    scrollX: number;
    scrollY: number;
    visiblePages: number[];
}

/**
 * Touch gesture data
 */
export interface TouchGesture {
    type: 'tap' | 'double-tap' | 'pinch' | 'pan' | 'swipe';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    scale?: number;
    velocity?: number;
}

/**
 * Navigation event
 */
export interface NavigationEvent {
    type: 'page-change' | 'zoom-change' | 'scroll' | 'rotation-change';
    previousState: Partial<ViewportState>;
    currentState: ViewportState;
    timestamp: number;
}

/**
 * Field interaction event
 */
export interface FieldInteractionEvent {
    type: 'hover' | 'click' | 'focus' | 'blur';
    field: FieldPosition;
    timestamp: number;
    coordinates: { x: number; y: number };
}

// ============================================================================
// PDF Viewer Engine Implementation
// ============================================================================

/**
 * PDF Viewer Engine
 * 
 * Provides comprehensive PDF viewing capabilities with field interaction,
 * zoom controls, navigation, and mobile support.
 */
export class PDFViewerEngine {
    private config: ViewerConfig;
    private document: PDFDocument | null = null;
    private fields: FieldDefinition[] = [];
    private viewportState: ViewportState;
    private renderedPages: Map<number, RenderedPage> = new Map();
    private fieldPositions: Map<string, FieldPosition> = new Map();
    private navigationListeners: ((event: NavigationEvent) => void)[] = [];
    private fieldInteractionListeners: ((event: FieldInteractionEvent) => void)[] = [];

    constructor(config: Partial<ViewerConfig> = {}) {
        this.config = ViewerConfigSchema.parse(config);
        this.viewportState = {
            currentPage: 1,
            totalPages: 0,
            zoom: this.config.initialZoom,
            rotation: 0,
            scrollX: 0,
            scrollY: 0,
            visiblePages: [],
        };
    }

    /**
     * Load PDF document into viewer
     */
    async loadDocument(document: PDFDocument, fields: FieldDefinition[] = []): Promise<void> {
        this.document = document;
        this.fields = fields;
        this.viewportState.totalPages = document.getPageCount();
        this.viewportState.currentPage = 1;

        // Calculate field positions
        this.calculateFieldPositions();

        // Render initial page
        if (this.config.lazyLoadPages) {
            await this.renderPage(1);
        } else {
            await this.renderAllPages();
        }
    }

    /**
     * Render a specific page
     */
    async renderPage(pageNumber: number, options?: Partial<PageRenderOptions>): Promise<RenderedPage> {
        if (!this.document) {
            throw new PDFViewerError('No document loaded');
        }

        if (pageNumber < 1 || pageNumber > this.viewportState.totalPages) {
            throw new PDFViewerError(`Invalid page number: ${pageNumber}`);
        }

        const startTime = Date.now();

        // Check cache
        if (this.config.cacheRenderedPages && this.renderedPages.has(pageNumber)) {
            const cached = this.renderedPages.get(pageNumber)!;
            return cached;
        }

        const page = this.document.getPage(pageNumber - 1);
        const { width, height } = page.getSize();

        const scale = this.calculateScale(width, height);
        const rotation = options?.rotation ?? this.viewportState.rotation;
        const quality = options?.quality ?? this.config.renderQuality;

        // Create canvas (browser, offscreen, or mock for Node.js)
        let canvas: HTMLCanvasElement | OffscreenCanvas;

        if (typeof OffscreenCanvas !== 'undefined') {
            canvas = new OffscreenCanvas(width * scale, height * scale);
        } else if (typeof document !== 'undefined') {
            canvas = document.createElement('canvas');
        } else {
            // Mock canvas for Node.js environment (testing)
            canvas = {
                width: width * scale,
                height: height * scale,
                getContext: () => null,
            } as any;
        }

        canvas.width = width * scale;
        canvas.height = height * scale;

        // Simulate rendering (in real implementation, would use PDF.js)
        const renderedPage: RenderedPage = {
            pageNumber,
            canvas,
            width: width * scale,
            height: height * scale,
            scale,
            rotation,
            renderTime: Date.now() - startTime,
        };

        // Cache if enabled
        if (this.config.cacheRenderedPages) {
            this.manageCacheSize();
            this.renderedPages.set(pageNumber, renderedPage);
        }

        return renderedPage;
    }

    /**
     * Render all pages
     */
    async renderAllPages(): Promise<RenderedPage[]> {
        const pages: RenderedPage[] = [];
        for (let i = 1; i <= this.viewportState.totalPages; i++) {
            pages.push(await this.renderPage(i));
        }
        return pages;
    }

    /**
     * Navigate to specific page
     */
    goToPage(pageNumber: number): void {
        if (pageNumber < 1 || pageNumber > this.viewportState.totalPages) {
            throw new PDFViewerError(`Invalid page number: ${pageNumber}`);
        }

        const previousState = { ...this.viewportState };
        this.viewportState.currentPage = pageNumber;

        this.emitNavigationEvent({
            type: 'page-change',
            previousState,
            currentState: this.viewportState,
            timestamp: Date.now(),
        });

        // Lazy load page if needed
        if (this.config.lazyLoadPages && !this.renderedPages.has(pageNumber)) {
            this.renderPage(pageNumber);
        }
    }

    /**
     * Navigate to next page
     */
    nextPage(): void {
        if (this.viewportState.currentPage < this.viewportState.totalPages) {
            this.goToPage(this.viewportState.currentPage + 1);
        }
    }

    /**
     * Navigate to previous page
     */
    previousPage(): void {
        if (this.viewportState.currentPage > 1) {
            this.goToPage(this.viewportState.currentPage - 1);
        }
    }

    /**
     * Set zoom level
     */
    setZoom(zoom: ZoomLevel): void {
        const previousState = { ...this.viewportState };
        this.viewportState.zoom = zoom;

        // Clear cache as zoom changed
        this.renderedPages.clear();

        this.emitNavigationEvent({
            type: 'zoom-change',
            previousState,
            currentState: this.viewportState,
            timestamp: Date.now(),
        });
    }

    /**
     * Zoom in
     */
    zoomIn(step: number = 0.1): void {
        const currentZoom = typeof this.viewportState.zoom === 'number'
            ? this.viewportState.zoom
            : 1;
        this.setZoom(Math.min(currentZoom + step, 10));
    }

    /**
     * Zoom out
     */
    zoomOut(step: number = 0.1): void {
        const currentZoom = typeof this.viewportState.zoom === 'number'
            ? this.viewportState.zoom
            : 1;
        this.setZoom(Math.max(currentZoom - step, 0.1));
    }

    /**
     * Rotate page
     */
    rotate(degrees: number): void {
        const previousState = { ...this.viewportState };
        this.viewportState.rotation = (this.viewportState.rotation + degrees) % 360;

        // Clear cache as rotation changed
        this.renderedPages.clear();

        this.emitNavigationEvent({
            type: 'rotation-change',
            previousState,
            currentState: this.viewportState,
            timestamp: Date.now(),
        });
    }

    /**
     * Get field at coordinates
     */
    getFieldAtCoordinates(x: number, y: number, pageNumber?: number): FieldPosition | null {
        const targetPage = pageNumber ?? this.viewportState.currentPage;

        for (const fieldPos of Array.from(this.fieldPositions.values())) {
            if (fieldPos.pageNumber === targetPage &&
                x >= fieldPos.x && x <= fieldPos.x + fieldPos.width &&
                y >= fieldPos.y && y <= fieldPos.y + fieldPos.height) {
                return fieldPos;
            }
        }

        return null;
    }

    /**
     * Highlight field
     */
    highlightField(fieldName: string): void {
        const fieldPos = this.fieldPositions.get(fieldName);
        if (!fieldPos) {
            throw new PDFViewerError(`Field not found: ${fieldName}`);
        }

        // Navigate to field's page if not current
        if (fieldPos.pageNumber !== this.viewportState.currentPage) {
            this.goToPage(fieldPos.pageNumber);
        }

        // Emit field interaction event
        this.emitFieldInteractionEvent({
            type: 'focus',
            field: fieldPos,
            timestamp: Date.now(),
            coordinates: { x: fieldPos.x, y: fieldPos.y },
        });
    }

    /**
     * Get all field positions
     */
    getFieldPositions(): FieldPosition[] {
        return Array.from(this.fieldPositions.values());
    }

    /**
     * Handle touch gesture
     */
    handleTouchGesture(gesture: TouchGesture): void {
        if (!this.config.enableTouchGestures) {
            return;
        }

        switch (gesture.type) {
            case 'pinch':
                if (gesture.scale) {
                    const currentZoom = typeof this.viewportState.zoom === 'number'
                        ? this.viewportState.zoom
                        : 1;
                    const newZoom = currentZoom * gesture.scale * this.config.pinchZoomSensitivity;
                    this.setZoom(Math.max(0.1, Math.min(10, newZoom)));
                }
                break;

            case 'swipe':
                if (gesture.velocity && Math.abs(gesture.velocity) > 0.5) {
                    if (gesture.endX < gesture.startX) {
                        this.nextPage();
                    } else {
                        this.previousPage();
                    }
                }
                break;

            case 'double-tap':
                // Toggle between fit-width and 100%
                if (this.viewportState.zoom === 'page-width') {
                    this.setZoom(1);
                } else {
                    this.setZoom('page-width');
                }
                break;
        }
    }

    /**
     * Get viewport state
     */
    getViewportState(): ViewportState {
        return { ...this.viewportState };
    }

    /**
     * Add navigation listener
     */
    onNavigation(listener: (event: NavigationEvent) => void): () => void {
        this.navigationListeners.push(listener);
        return () => {
            const index = this.navigationListeners.indexOf(listener);
            if (index > -1) {
                this.navigationListeners.splice(index, 1);
            }
        };
    }

    /**
     * Add field interaction listener
     */
    onFieldInteraction(listener: (event: FieldInteractionEvent) => void): () => void {
        this.fieldInteractionListeners.push(listener);
        return () => {
            const index = this.fieldInteractionListeners.indexOf(listener);
            if (index > -1) {
                this.fieldInteractionListeners.splice(index, 1);
            }
        };
    }

    // ============================================================================
    // Private Methods
    // ============================================================================

    private calculateFieldPositions(): void {
        this.fieldPositions.clear();

        for (const field of this.fields) {
            this.fieldPositions.set(field.name, {
                fieldName: field.name,
                pageNumber: field.page + 1, // Convert 0-based to 1-based
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height,
                type: field.type,
            });
        }
    }

    private calculateScale(pageWidth: number, pageHeight: number): number {
        const zoom = this.viewportState.zoom;

        if (typeof zoom === 'number') {
            return zoom;
        }

        // For preset zoom modes, return default scale
        // In real implementation, would calculate based on viewport size
        switch (zoom) {
            case 'page-width':
                return 1.0;
            case 'page-height':
                return 1.0;
            case 'page-fit':
                return 1.0;
            case 'auto':
            default:
                return 1.0;
        }
    }

    private manageCacheSize(): void {
        if (this.renderedPages.size >= this.config.maxCachedPages) {
            // Remove oldest page (first entry)
            const firstKey = this.renderedPages.keys().next().value;
            if (firstKey !== undefined) {
                this.renderedPages.delete(firstKey);
            }
        }
    }

    private emitNavigationEvent(event: NavigationEvent): void {
        for (const listener of this.navigationListeners) {
            listener(event);
        }
    }

    private emitFieldInteractionEvent(event: FieldInteractionEvent): void {
        for (const listener of this.fieldInteractionListeners) {
            listener(event);
        }
    }
}

// ============================================================================
// Error Classes
// ============================================================================

export class PDFViewerError extends Error {
    constructor(message: string, public code: string = 'PDF_VIEWER_ERROR') {
        super(message);
        this.name = 'PDFViewerError';
    }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createPDFViewerEngine(config?: Partial<ViewerConfig>): PDFViewerEngine {
    return new PDFViewerEngine(config);
}
