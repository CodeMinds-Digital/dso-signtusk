import {
    EmailTemplateService,
    EmailTemplateCustomization,
    TemplateEngine,
    TemplateError
} from '../types';
import { HandlebarsRenderer } from './renderers/handlebars';
import { ReactEmailRenderer } from './renderers/react-email';
import { MustacheRenderer } from './renderers/mustache';
import { Logger } from 'pino';
import { v4 as uuidv4 } from 'uuid';

/**
 * Email Template Service Implementation
 * Provides email template creation, customization, and rendering with multiple template engines
 */
export class EmailTemplateServiceImpl implements EmailTemplateService {
    private templates: Map<string, EmailTemplateCustomization> = new Map();
    private renderers: Map<TemplateEngine, any> = new Map();
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger.child({ service: 'email-templates' });

        // Initialize template renderers
        this.initializeRenderers();

        this.logger.info('Email template service initialized');
    }

    private initializeRenderers(): void {
        try {
            this.renderers.set(TemplateEngine.HANDLEBARS, new HandlebarsRenderer(this.logger));
            this.renderers.set(TemplateEngine.REACT_EMAIL, new ReactEmailRenderer(this.logger));
            this.renderers.set(TemplateEngine.MUSTACHE, new MustacheRenderer(this.logger));

            this.logger.info('Template renderers initialized');
        } catch (error) {
            this.logger.error({ error }, 'Failed to initialize template renderers');
            throw new TemplateError(`Failed to initialize template renderers: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async createTemplate(template: EmailTemplateCustomization): Promise<string> {
        try {
            // Validate template
            this.validateTemplate(template);

            // Generate ID if not provided
            const templateId = template.id || uuidv4();
            const templateWithId = { ...template, id: templateId };

            // Test render to ensure template is valid
            await this.testRender(templateWithId);

            // Store template
            this.templates.set(templateId, templateWithId);

            this.logger.info({
                templateId,
                name: template.name,
                engine: template.engine
            }, 'Email template created');

            return templateId;

        } catch (error) {
            this.logger.error({ error, templateName: template.name }, 'Failed to create email template');
            throw new TemplateError(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async updateTemplate(id: string, template: Partial<EmailTemplateCustomization>): Promise<boolean> {
        try {
            const existingTemplate = this.templates.get(id);
            if (!existingTemplate) {
                throw new TemplateError(`Template with ID ${id} not found`);
            }

            const updatedTemplate = {
                ...existingTemplate,
                ...template,
                id,
                updatedAt: new Date()
            };

            // Validate updated template
            this.validateTemplate(updatedTemplate);

            // Test render to ensure template is still valid
            await this.testRender(updatedTemplate);

            // Update template
            this.templates.set(id, updatedTemplate);

            this.logger.info({
                templateId: id,
                name: updatedTemplate.name
            }, 'Email template updated');

            return true;

        } catch (error) {
            this.logger.error({ error, templateId: id }, 'Failed to update email template');
            throw new TemplateError(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async deleteTemplate(id: string): Promise<boolean> {
        try {
            const template = this.templates.get(id);
            if (!template) {
                return false;
            }

            this.templates.delete(id);

            this.logger.info({
                templateId: id,
                name: template.name
            }, 'Email template deleted');

            return true;

        } catch (error) {
            this.logger.error({ error, templateId: id }, 'Failed to delete email template');
            throw new TemplateError(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getTemplate(id: string): Promise<EmailTemplateCustomization | null> {
        try {
            const template = this.templates.get(id);
            return template || null;
        } catch (error) {
            this.logger.error({ error, templateId: id }, 'Failed to get email template');
            return null;
        }
    }

    async listTemplates(organizationId?: string): Promise<EmailTemplateCustomization[]> {
        try {
            const templates = Array.from(this.templates.values());

            if (organizationId) {
                return templates.filter(t => t.organizationId === organizationId);
            }

            return templates;
        } catch (error) {
            this.logger.error({ error, organizationId }, 'Failed to list email templates');
            throw new TemplateError(`Failed to list templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async renderTemplate(templateId: string, data: Record<string, any>): Promise<{ html: string; text?: string; subject: string }> {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new TemplateError(`Template with ID ${templateId} not found`);
            }

            if (!template.isActive) {
                throw new TemplateError(`Template ${templateId} is not active`);
            }

            const renderer = this.renderers.get(template.engine);
            if (!renderer) {
                throw new TemplateError(`Renderer for engine ${template.engine} not found`);
            }

            // Merge template data with provided data
            const mergedData = {
                ...data,
                styles: template.styles || {},
                organizationId: template.organizationId
            };

            this.logger.debug({
                templateId,
                engine: template.engine,
                dataKeys: Object.keys(mergedData)
            }, 'Rendering email template');

            const result = await renderer.render(template, mergedData);

            this.logger.info({
                templateId,
                name: template.name,
                htmlLength: result.html.length
            }, 'Email template rendered successfully');

            return result;

        } catch (error) {
            this.logger.error({ error, templateId }, 'Failed to render email template');
            throw new TemplateError(`Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async previewTemplate(template: EmailTemplateCustomization, data: Record<string, any>): Promise<{ html: string; text?: string; subject: string }> {
        try {
            // Validate template without storing it
            this.validateTemplate(template);

            const renderer = this.renderers.get(template.engine);
            if (!renderer) {
                throw new TemplateError(`Renderer for engine ${template.engine} not found`);
            }

            // Merge template data with provided data
            const mergedData = {
                ...data,
                styles: template.styles || {},
                organizationId: template.organizationId
            };

            this.logger.debug({
                templateName: template.name,
                engine: template.engine
            }, 'Previewing email template');

            const result = await renderer.render(template, mergedData);

            this.logger.info({
                templateName: template.name,
                htmlLength: result.html.length
            }, 'Email template preview generated');

            return result;

        } catch (error) {
            this.logger.error({ error, templateName: template.name }, 'Failed to preview email template');
            throw new TemplateError(`Failed to preview template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private validateTemplate(template: EmailTemplateCustomization): void {
        if (!template.name || template.name.trim().length === 0) {
            throw new TemplateError('Template name is required');
        }

        if (!template.subject || template.subject.trim().length === 0) {
            throw new TemplateError('Template subject is required');
        }

        if (!template.htmlTemplate || template.htmlTemplate.trim().length === 0) {
            throw new TemplateError('Template HTML content is required');
        }

        if (!Object.values(TemplateEngine).includes(template.engine)) {
            throw new TemplateError(`Invalid template engine: ${template.engine}`);
        }

        // Validate variables
        if (template.variables) {
            for (const variable of template.variables) {
                if (!variable.name || variable.name.trim().length === 0) {
                    throw new TemplateError('Variable name is required');
                }

                if (!['string', 'number', 'boolean', 'date', 'object'].includes(variable.type)) {
                    throw new TemplateError(`Invalid variable type: ${variable.type}`);
                }
            }
        }

        // Validate styles
        if (template.styles) {
            const validColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

            if (template.styles.primaryColor && !validColorRegex.test(template.styles.primaryColor)) {
                throw new TemplateError('Invalid primary color format');
            }

            if (template.styles.secondaryColor && !validColorRegex.test(template.styles.secondaryColor)) {
                throw new TemplateError('Invalid secondary color format');
            }
        }
    }

    private async testRender(template: EmailTemplateCustomization): Promise<void> {
        try {
            const renderer = this.renderers.get(template.engine);
            if (!renderer) {
                throw new TemplateError(`Renderer for engine ${template.engine} not found`);
            }

            // Create test data based on template variables
            const testData: Record<string, any> = {};
            if (template.variables) {
                for (const variable of template.variables) {
                    switch (variable.type) {
                        case 'string':
                            testData[variable.name] = variable.defaultValue || 'Test String';
                            break;
                        case 'number':
                            testData[variable.name] = variable.defaultValue || 123;
                            break;
                        case 'boolean':
                            testData[variable.name] = variable.defaultValue || true;
                            break;
                        case 'date':
                            testData[variable.name] = variable.defaultValue || new Date();
                            break;
                        case 'object':
                            testData[variable.name] = variable.defaultValue || {};
                            break;
                    }
                }
            }

            // Test render
            await renderer.render(template, testData);

        } catch (error) {
            throw new TemplateError(`Template validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get template usage statistics
     */
    getTemplateStats(templateId: string): any {
        const template = this.templates.get(templateId);
        if (!template) {
            return null;
        }

        return {
            id: templateId,
            name: template.name,
            engine: template.engine,
            isActive: template.isActive,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            variableCount: template.variables?.length || 0,
            hasStyles: !!template.styles,
            organizationId: template.organizationId
        };
    }

    /**
     * Clone an existing template
     */
    async cloneTemplate(templateId: string, newName: string, organizationId?: string): Promise<string> {
        try {
            const originalTemplate = this.templates.get(templateId);
            if (!originalTemplate) {
                throw new TemplateError(`Template with ID ${templateId} not found`);
            }

            const clonedTemplate: EmailTemplateCustomization = {
                ...originalTemplate,
                id: uuidv4(),
                name: newName,
                organizationId: organizationId || originalTemplate.organizationId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            return await this.createTemplate(clonedTemplate);

        } catch (error) {
            this.logger.error({ error, templateId, newName }, 'Failed to clone email template');
            throw new TemplateError(`Failed to clone template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Export template as JSON
     */
    async exportTemplate(templateId: string): Promise<string> {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new TemplateError(`Template with ID ${templateId} not found`);
            }

            return JSON.stringify(template, null, 2);

        } catch (error) {
            this.logger.error({ error, templateId }, 'Failed to export email template');
            throw new TemplateError(`Failed to export template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Import template from JSON
     */
    async importTemplate(templateJson: string, organizationId?: string): Promise<string> {
        try {
            const template = JSON.parse(templateJson) as EmailTemplateCustomization;

            // Override organization ID if provided
            if (organizationId) {
                template.organizationId = organizationId;
            }

            // Generate new ID and timestamps
            template.id = uuidv4();
            template.createdAt = new Date();
            template.updatedAt = new Date();

            return await this.createTemplate(template);

        } catch (error) {
            this.logger.error({ error }, 'Failed to import email template');
            throw new TemplateError(`Failed to import template: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
        }
    }
}