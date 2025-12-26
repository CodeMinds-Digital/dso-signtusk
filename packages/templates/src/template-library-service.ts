import { PrismaClient } from '@signtusk/database';
import { pino } from 'pino';
import { z } from 'zod';

const logger = pino({ name: 'template-library-service' });

// Template library search and filtering schemas
export const TemplateSearchSchema = z.object({
    query: z.string().optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    rating: z.object({
        min: z.number().min(0).max(5).optional(),
        max: z.number().min(0).max(5).optional(),
    }).optional(),
    usageCount: z.object({
        min: z.number().min(0).optional(),
        max: z.number().optional(),
    }).optional(),
    dateRange: z.object({
        from: z.date().optional(),
        to: z.date().optional(),
    }).optional(),
    createdBy: z.string().optional(),
    isPublic: z.boolean().optional(),
    sortBy: z.enum(['name', 'rating', 'usageCount', 'createdAt', 'updatedAt', 'relevance']).default('relevance'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
});

export const TemplateRatingSchema = z.object({
    templateId: z.string(),
    rating: z.number().min(1).max(5),
    review: z.string().max(1000).optional(),
});

export const TemplateComparisonSchema = z.object({
    templateIds: z.array(z.string()).min(2).max(5),
});

// Type exports
export type TemplateSearch = z.infer<typeof TemplateSearchSchema>;
export type TemplateRating = z.infer<typeof TemplateRatingSchema>;
export type TemplateComparison = z.infer<typeof TemplateComparisonSchema>;

// Template library interfaces
export interface TemplateLibraryItem {
    id: string;
    name: string;
    description?: string;
    category?: string;
    tags: string[];
    isPublic: boolean;
    rating: {
        average: number;
        count: number;
    };
    usageCount: number;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: Date;
    updatedAt: Date;
    preview: {
        thumbnailUrl?: string;
        fieldCount: number;
        recipientCount: number;
        pageCount: number;
    };
}

export interface TemplateReview {
    id: string;
    templateId: string;
    userId: string;
    rating: number;
    review?: string;
    createdAt: Date;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export interface TemplateComparisonResult {
    templates: Array<{
        id: string;
        name: string;
        description?: string;
        category?: string;
        tags: string[];
        rating: { average: number; count: number };
        usageCount: number;
        fields: Array<{
            type: string;
            name: string;
            isRequired: boolean;
        }>;
        recipients: Array<{
            role: string;
            order: number;
            isRequired: boolean;
        }>;
        workflow?: {
            type: string;
            stepCount: number;
        };
        createdBy: {
            id: string;
            name: string;
        };
        createdAt: Date;
    }>;
    comparison: {
        commonFields: string[];
        uniqueFields: Record<string, string[]>;
        commonRecipients: string[];
        uniqueRecipients: Record<string, string[]>;
        complexityScore: Record<string, number>;
    };
}

export class TemplateLibraryService {
    constructor(private db: PrismaClient) { }

    /**
     * Search and browse templates with advanced filtering
     */
    async searchTemplates(
        searchParams: TemplateSearch,
        userId: string,
        organizationId: string
    ): Promise<{
        templates: TemplateLibraryItem[];
        total: number;
        facets: {
            categories: Array<{ name: string; count: number }>;
            tags: Array<{ name: string; count: number }>;
            ratings: Array<{ rating: number; count: number }>;
        };
    }> {
        try {
            // Build base where clause
            const baseWhere: any = {
                OR: [
                    { organizationId },
                    { isPublic: true },
                ],
                isArchived: false,
            };

            // Apply filters
            const where = this.buildSearchWhere(baseWhere, searchParams);

            // Get templates with ratings and usage data
            const [templates, total, facets] = await Promise.all([
                this.getTemplatesWithMetadata(where, searchParams),
                this.db.template.count({ where }),
                this.getFacets(baseWhere, organizationId),
            ]);

            return {
                templates,
                total,
                facets,
            };
        } catch (error) {
            logger.error({ error, searchParams, userId }, 'Failed to search templates');
            throw new Error('Failed to search templates');
        }
    }

    /**
     * Get template categories with counts
     */
    async getCategories(
        organizationId: string
    ): Promise<Array<{ name: string; count: number; description?: string }>> {
        try {
            const categories = await this.db.template.groupBy({
                by: ['category'],
                where: {
                    OR: [
                        { organizationId },
                        { isPublic: true },
                    ],
                    isArchived: false,
                    category: { not: null },
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
            });

            // Add predefined category descriptions
            const categoryDescriptions: Record<string, string> = {
                'contracts': 'Legal contracts and agreements',
                'hr': 'Human resources documents',
                'sales': 'Sales agreements and proposals',
                'finance': 'Financial documents and invoices',
                'legal': 'Legal documents and forms',
                'marketing': 'Marketing materials and releases',
                'operations': 'Operational procedures and forms',
                'compliance': 'Compliance and regulatory documents',
            };

            return categories.map(cat => ({
                name: cat.category!,
                count: cat._count.id,
                description: categoryDescriptions[cat.category!.toLowerCase()],
            }));
        } catch (error) {
            logger.error({ error, organizationId }, 'Failed to get categories');
            throw new Error('Failed to get categories');
        }
    }

    /**
     * Get popular tags with counts
     */
    async getPopularTags(
        organizationId: string,
        limit: number = 50
    ): Promise<Array<{ name: string; count: number }>> {
        try {
            // Get all templates with tags
            const templates = await this.db.template.findMany({
                where: {
                    OR: [
                        { organizationId },
                        { isPublic: true },
                    ],
                    isArchived: false,
                },
                select: {
                    tags: true,
                },
            });

            // Count tag occurrences
            const tagCounts = new Map<string, number>();
            templates.forEach(template => {
                const tags = template.tags as string[];
                tags.forEach(tag => {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                });
            });

            // Sort by count and return top tags
            return Array.from(tagCounts.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        } catch (error) {
            logger.error({ error, organizationId }, 'Failed to get popular tags');
            throw new Error('Failed to get popular tags');
        }
    }

    /**
     * Rate a template
     */
    async rateTemplate(
        ratingData: TemplateRating,
        userId: string,
        organizationId: string
    ): Promise<{ success: boolean; message?: string; errors?: string[] }> {
        try {
            // Check if template exists and user has access
            const template = await this.db.template.findFirst({
                where: {
                    id: ratingData.templateId,
                    OR: [
                        { organizationId },
                        { isPublic: true },
                    ],
                },
            });

            if (!template) {
                return {
                    success: false,
                    errors: ['Template not found'],
                };
            }

            // Check if user already rated this template
            const existingRating = await this.db.templateRating.findFirst({
                where: {
                    templateId: ratingData.templateId,
                    userId,
                },
            });

            if (existingRating) {
                // Update existing rating
                await this.db.templateRating.update({
                    where: { id: existingRating.id },
                    data: {
                        rating: ratingData.rating,
                        review: ratingData.review,
                        updatedAt: new Date(),
                    },
                });
            } else {
                // Create new rating
                await this.db.templateRating.create({
                    data: {
                        templateId: ratingData.templateId,
                        userId,
                        rating: ratingData.rating,
                        review: ratingData.review,
                    },
                });
            }

            // Update template's average rating
            await this.updateTemplateRating(ratingData.templateId);

            return {
                success: true,
                message: existingRating ? 'Rating updated successfully' : 'Rating added successfully',
            };
        } catch (error) {
            logger.error({ error, ratingData, userId }, 'Failed to rate template');
            return {
                success: false,
                errors: ['Failed to rate template'],
            };
        }
    }

    /**
     * Get template reviews
     */
    async getTemplateReviews(
        templateId: string,
        organizationId: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<{
        reviews: TemplateReview[];
        total: number;
        averageRating: number;
    }> {
        try {
            // Check if template exists and user has access
            const template = await this.db.template.findFirst({
                where: {
                    id: templateId,
                    OR: [
                        { organizationId },
                        { isPublic: true },
                    ],
                },
            });

            if (!template) {
                throw new Error('Template not found');
            }

            const [reviews, total, avgRating] = await Promise.all([
                this.db.templateRating.findMany({
                    where: { templateId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: offset,
                }),
                this.db.templateRating.count({ where: { templateId } }),
                this.db.templateRating.aggregate({
                    where: { templateId },
                    _avg: { rating: true },
                }),
            ]);

            return {
                reviews: reviews.map(review => ({
                    id: review.id,
                    templateId: review.templateId,
                    userId: review.userId,
                    rating: review.rating,
                    review: review.review || undefined,
                    createdAt: review.createdAt,
                    user: review.user,
                })),
                total,
                averageRating: avgRating._avg.rating || 0,
            };
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to get template reviews');
            throw new Error('Failed to get template reviews');
        }
    }

    /**
     * Compare multiple templates
     */
    async compareTemplates(
        comparisonData: TemplateComparison,
        userId: string,
        organizationId: string
    ): Promise<TemplateComparisonResult> {
        try {
            // Get templates with full details
            const templates = await this.db.template.findMany({
                where: {
                    id: { in: comparisonData.templateIds },
                    OR: [
                        { organizationId },
                        { isPublic: true },
                    ],
                },
                include: {
                    templateFields: true,
                    templateRecipients: {
                        orderBy: { order: 'asc' },
                    },
                    creator: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            signingRequests: true,
                        },
                    },
                },
            });

            if (templates.length !== comparisonData.templateIds.length) {
                throw new Error('Some templates not found or access denied');
            }

            // Get ratings for templates
            const ratings = await this.db.templateRating.groupBy({
                by: ['templateId'],
                where: {
                    templateId: { in: comparisonData.templateIds },
                },
                _avg: { rating: true },
                _count: { id: true },
            });

            const ratingMap = new Map(
                ratings.map(r => [r.templateId, { average: r._avg.rating || 0, count: r._count.id }])
            );

            // Build comparison result
            const comparisonTemplates = templates.map(template => ({
                id: template.id,
                name: template.name,
                description: template.description || undefined,
                category: template.category || undefined,
                tags: template.tags as string[],
                rating: ratingMap.get(template.id) || { average: 0, count: 0 },
                usageCount: template._count.signingRequests,
                fields: template.templateFields.map((field: any) => ({
                    type: field.type,
                    name: field.name,
                    isRequired: field.isRequired,
                })),
                recipients: template.templateRecipients.map((recipient: any) => ({
                    role: recipient.role,
                    order: recipient.order,
                    isRequired: recipient.isRequired,
                })),
                workflow: template.workflow ? {
                    type: (template.workflow as any).type || 'sequential',
                    stepCount: (template.workflow as any).steps?.length || 0,
                } : undefined,
                createdBy: template.creator,
                createdAt: template.createdAt,
            }));

            // Analyze commonalities and differences
            const comparison = this.analyzeTemplateComparison(comparisonTemplates);

            return {
                templates: comparisonTemplates,
                comparison,
            };
        } catch (error) {
            logger.error({ error, comparisonData, userId }, 'Failed to compare templates');
            throw new Error('Failed to compare templates');
        }
    }

    /**
     * Get template preview data
     */
    async getTemplatePreview(
        templateId: string,
        organizationId: string
    ): Promise<{
        id: string;
        name: string;
        description?: string;
        category?: string;
        tags: string[];
        fieldCount: number;
        recipientCount: number;
        pageCount: number;
        thumbnailUrl?: string;
        rating: { average: number; count: number };
        usageCount: number;
        createdBy: { name: string; email: string };
        createdAt: Date;
    }> {
        try {
            const template = await this.db.template.findFirst({
                where: {
                    id: templateId,
                    OR: [
                        { organizationId },
                        { isPublic: true },
                    ],
                },
                include: {
                    templateFields: true,
                    templateRecipients: true,
                    document: {
                        select: {
                            metadata: true,
                        },
                    },
                    creator: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            signingRequests: true,
                        },
                    },
                },
            });

            if (!template) {
                throw new Error('Template not found');
            }

            // Get rating
            const rating = await this.db.templateRating.aggregate({
                where: { templateId },
                _avg: { rating: true },
                _count: { id: true },
            });

            // Extract page count from document metadata
            const metadata = template.document.metadata as any;
            const pageCount = metadata?.pageCount || 1;

            return {
                id: template.id,
                name: template.name,
                description: template.description || undefined,
                category: template.category || undefined,
                tags: template.tags as string[],
                fieldCount: template.templateFields.length,
                recipientCount: template.templateRecipients.length,
                pageCount,
                thumbnailUrl: metadata?.thumbnailUrl,
                rating: {
                    average: rating._avg.rating || 0,
                    count: rating._count.id,
                },
                usageCount: template._count.signingRequests,
                createdBy: template.creator,
                createdAt: template.createdAt,
            };
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to get template preview');
            throw new Error('Failed to get template preview');
        }
    }

    /**
     * Build search where clause
     */
    private buildSearchWhere(baseWhere: any, searchParams: TemplateSearch): any {
        const where = { ...baseWhere };

        // Text search
        if (searchParams.query) {
            where.AND = [
                ...(where.AND || []),
                {
                    OR: [
                        { name: { contains: searchParams.query, mode: 'insensitive' } },
                        { description: { contains: searchParams.query, mode: 'insensitive' } },
                        { category: { contains: searchParams.query, mode: 'insensitive' } },
                    ],
                },
            ];
        }

        // Category filter
        if (searchParams.categories && searchParams.categories.length > 0) {
            where.category = { in: searchParams.categories };
        }

        // Tags filter
        if (searchParams.tags && searchParams.tags.length > 0) {
            where.tags = { hasEvery: searchParams.tags };
        }

        // Date range filter
        if (searchParams.dateRange) {
            const dateFilter: any = {};
            if (searchParams.dateRange.from) {
                dateFilter.gte = searchParams.dateRange.from;
            }
            if (searchParams.dateRange.to) {
                dateFilter.lte = searchParams.dateRange.to;
            }
            if (Object.keys(dateFilter).length > 0) {
                where.createdAt = dateFilter;
            }
        }

        // Created by filter
        if (searchParams.createdBy) {
            where.createdBy = searchParams.createdBy;
        }

        // Public filter
        if (searchParams.isPublic !== undefined) {
            where.isPublic = searchParams.isPublic;
        }

        return where;
    }

    /**
     * Get templates with metadata including ratings and usage
     */
    private async getTemplatesWithMetadata(
        where: any,
        searchParams: TemplateSearch
    ): Promise<TemplateLibraryItem[]> {
        // Build order by clause
        let orderBy: any;
        switch (searchParams.sortBy) {
            case 'rating':
                // This would need a more complex query with joins
                orderBy = { createdAt: searchParams.sortOrder };
                break;
            case 'usageCount':
                orderBy = { signingRequests: { _count: searchParams.sortOrder } };
                break;
            case 'relevance':
                // For now, use creation date as relevance
                orderBy = { createdAt: 'desc' };
                break;
            default:
                orderBy = { [searchParams.sortBy]: searchParams.sortOrder };
        }

        const templates = await this.db.template.findMany({
            where,
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                templateFields: true,
                templateRecipients: true,
                document: {
                    select: {
                        metadata: true,
                    },
                },
                _count: {
                    select: {
                        signingRequests: true,
                    },
                },
            },
            orderBy,
            take: searchParams.limit,
            skip: searchParams.offset,
        });

        // Get ratings for all templates
        const templateIds = templates.map(t => t.id);
        const ratings = await this.db.templateRating.groupBy({
            by: ['templateId'],
            where: {
                templateId: { in: templateIds },
            },
            _avg: { rating: true },
            _count: { id: true },
        });

        const ratingMap = new Map(
            ratings.map(r => [r.templateId, { average: r._avg.rating || 0, count: r._count.id }])
        );

        return templates.map(template => {
            const metadata = template.document.metadata as any;
            return {
                id: template.id,
                name: template.name,
                description: template.description || undefined,
                category: template.category || undefined,
                tags: template.tags as string[],
                isPublic: template.isPublic,
                rating: ratingMap.get(template.id) || { average: 0, count: 0 },
                usageCount: template._count.signingRequests,
                createdBy: template.creator,
                createdAt: template.createdAt,
                updatedAt: template.updatedAt,
                preview: {
                    thumbnailUrl: metadata?.thumbnailUrl,
                    fieldCount: template.templateFields.length,
                    recipientCount: template.templateRecipients.length,
                    pageCount: metadata?.pageCount || 1,
                },
            };
        });
    }

    /**
     * Get search facets for filtering
     */
    private async getFacets(baseWhere: any, organizationId: string) {
        const [categories, ratings] = await Promise.all([
            this.db.template.groupBy({
                by: ['category'],
                where: {
                    ...baseWhere,
                    category: { not: null },
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
            }),
            this.db.templateRating.groupBy({
                by: ['rating'],
                where: {
                    template: baseWhere,
                },
                _count: { id: true },
                orderBy: { rating: 'desc' },
            }),
        ]);

        // Get popular tags
        const templates = await this.db.template.findMany({
            where: baseWhere,
            select: { tags: true },
        });

        const tagCounts = new Map<string, number>();
        templates.forEach(template => {
            const tags = template.tags as string[];
            tags.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });

        const topTags = Array.from(tagCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        return {
            categories: categories.map(cat => ({
                name: cat.category!,
                count: cat._count.id,
            })),
            tags: topTags,
            ratings: ratings.map(r => ({
                rating: r.rating,
                count: r._count.id,
            })),
        };
    }

    /**
     * Update template's average rating
     */
    private async updateTemplateRating(templateId: string): Promise<void> {
        const rating = await this.db.templateRating.aggregate({
            where: { templateId },
            _avg: { rating: true },
            _count: { id: true },
        });

        // Store rating in template metadata for easier querying
        await this.db.template.update({
            where: { id: templateId },
            data: {
                settings: {
                    rating: {
                        average: rating._avg.rating || 0,
                        count: rating._count.id,
                    },
                },
            },
        });
    }

    /**
     * Analyze template comparison
     */
    private analyzeTemplateComparison(templates: any[]): any {
        const allFields = templates.flatMap(t => t.fields.map((f: any) => f.name));
        const allRecipients = templates.flatMap(t => t.recipients.map((r: any) => r.role));

        // Find common fields
        const fieldCounts = new Map<string, number>();
        allFields.forEach(field => {
            fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
        });

        const commonFields = Array.from(fieldCounts.entries())
            .filter(([_, count]) => count === templates.length)
            .map(([field, _]) => field);

        // Find unique fields per template
        const uniqueFields: Record<string, string[]> = {};
        templates.forEach(template => {
            const templateFields = template.fields.map((f: any) => f.name);
            uniqueFields[template.id] = templateFields.filter((field: string) => !commonFields.includes(field));
        });

        // Find common recipients
        const recipientCounts = new Map<string, number>();
        allRecipients.forEach(recipient => {
            recipientCounts.set(recipient, (recipientCounts.get(recipient) || 0) + 1);
        });

        const commonRecipients = Array.from(recipientCounts.entries())
            .filter(([_, count]) => count === templates.length)
            .map(([recipient, _]) => recipient);

        // Find unique recipients per template
        const uniqueRecipients: Record<string, string[]> = {};
        templates.forEach(template => {
            const templateRecipients = template.recipients.map((r: any) => r.role);
            uniqueRecipients[template.id] = templateRecipients.filter((recipient: string) => !commonRecipients.includes(recipient));
        });

        // Calculate complexity scores
        const complexityScore: Record<string, number> = {};
        templates.forEach(template => {
            let score = 0;
            score += template.fields.length * 2; // Field complexity
            score += template.recipients.length * 3; // Recipient complexity
            score += template.workflow?.stepCount || 0 * 5; // Workflow complexity
            complexityScore[template.id] = score;
        });

        return {
            commonFields,
            uniqueFields,
            commonRecipients,
            uniqueRecipients,
            complexityScore,
        };
    }
}