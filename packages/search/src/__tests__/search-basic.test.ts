import { describe, it, expect } from 'vitest';
import { SearchService } from '../search-service';
import { SearchEntityType } from '../types';
import { searchService } from './setup';

/**
 * **Feature: docusign-alternative-comprehensive, Property 48: Performance Tracking Precision**
 * 
 * Basic tests for the advanced search system implementation.
 * These tests verify that search functionality works correctly.
 */

describe('Advanced Search System - Basic Tests', () => {

    describe('Search Query Processing', () => {
        it('should handle basic search queries', async () => {
            const query = {
                query: 'test document',
                entityTypes: [SearchEntityType.DOCUMENT],
                pagination: { page: 1, limit: 20 },
                highlight: true,
                suggestions: true,
                personalize: true
            };

            const result = await searchService.search(query, 'test-org-1', 'test-user-1');

            expect(result).toBeDefined();
            expect(result.documents).toBeInstanceOf(Array);
            expect(result.facets).toBeInstanceOf(Array);
            expect(result.suggestions).toBeInstanceOf(Array);
            expect(typeof result.total).toBe('number');
            expect(typeof result.searchTime).toBe('number');
            expect(result.searchTime).toBeGreaterThanOrEqual(0);
        });

        it('should handle empty queries', async () => {
            const query = {
                entityTypes: [SearchEntityType.DOCUMENT],
                pagination: { page: 1, limit: 20 }
            };

            const result = await searchService.search(query, 'test-org-1');

            expect(result).toBeDefined();
            expect(result.documents).toBeInstanceOf(Array);
        });
    });

    describe('Document Indexing', () => {
        it('should index a valid document', async () => {
            const document = {
                id: 'test-doc-1',
                type: SearchEntityType.DOCUMENT,
                title: 'Test Document',
                content: 'This is a test document',
                organizationId: 'test-org-1',
                userId: 'test-user-1',
                tags: ['test', 'document'],
                createdAt: new Date(),
                updatedAt: new Date(),
                permissions: ['public'],
                metadata: {
                    fileType: 'pdf',
                    fileSize: 1024000
                }
            };

            await expect(searchService.indexDocument(document)).resolves.not.toThrow();
        });
    });

    describe('Search Suggestions', () => {
        it('should provide suggestions for queries', async () => {
            const suggestions = await searchService.getSuggestions('test', 'test-org-1', 'test-user-1');

            expect(Array.isArray(suggestions)).toBe(true);

            suggestions.forEach(suggestion => {
                expect(typeof suggestion.text).toBe('string');
                expect(suggestion.text.length).toBeGreaterThan(0);
                expect(['completion', 'correction', 'phrase']).toContain(suggestion.type);
                expect(typeof suggestion.score).toBe('number');
                expect(suggestion.score).toBeGreaterThanOrEqual(0);
                expect(suggestion.score).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('Health Check', () => {
        it('should return valid health status', async () => {
            const health = await searchService.healthCheck();

            expect(health).toBeDefined();
            expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
            expect(typeof health.components).toBe('object');

            Object.values(health.components).forEach(component => {
                expect(typeof component.status).toBe('string');
            });
        });
    });
});