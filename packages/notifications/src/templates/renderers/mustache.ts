import { EmailTemplateCustomization, TemplateError } from '../../types';
import { Logger } from 'pino';

/**
 * Mustache Template Renderer
 * Provides Mustache-based email template rendering
 * Note: This is a stub implementation. Full Mustache.js integration would be needed in production.
 */
export class MustacheRenderer {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger.child({ renderer: 'mustache' });
    }

    async render(template: EmailTemplateCustomization, data: Record<string, any>): Promise<{ html: string; text?: string; subject: string }> {
        try {
            this.logger.debug({
                templateId: template.id,
                templateName: template.name
            }, 'Rendering Mustache template');

            // Prepare context with styles and data
            const context = {
                ...data,
                styles: this.prepareStyles(template.styles || {}),
                template: {
                    name: template.name,
                    id: template.id
                }
            };

            // Stub implementation - simple variable replacement
            const html = this.renderStubTemplate(template.htmlTemplate, context);
            const subject = this.renderStubTemplate(template.subject, context);
            const text = template.textTemplate ? this.renderStubTemplate(template.textTemplate, context) : undefined;

            this.logger.debug({
                templateId: template.id,
                htmlLength: html.length,
                hasText: !!text
            }, 'Mustache template rendered successfully');

            return { html, text, subject };

        } catch (error) {
            this.logger.error({
                error,
                templateId: template.id,
                templateName: template.name
            }, 'Failed to render Mustache template');

            throw new TemplateError(`Mustache rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private renderStubTemplate(templateString: string, data: Record<string, any>): string {
        // Stub implementation - simple variable replacement for Mustache syntax
        let result = templateString;

        // Replace simple variables like {{variable}}
        result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = data[key];
            return value !== undefined ? String(value) : match;
        });

        // Replace nested variables like {{object.property}}
        result = result.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, obj, prop) => {
            const value = data[obj]?.[prop];
            return value !== undefined ? String(value) : match;
        });

        // Handle sections {{#section}}...{{/section}}
        result = result.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, key, content) => {
            const value = data[key];
            if (Array.isArray(value)) {
                return value.map(item => this.renderStubTemplate(content, { ...data, ...item })).join('');
            } else if (value) {
                return this.renderStubTemplate(content, { ...data, ...value });
            }
            return '';
        });

        // Handle inverted sections {{^section}}...{{/section}}
        result = result.replace(/\{\{\^(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, key, content) => {
            const value = data[key];
            if (!value || (Array.isArray(value) && value.length === 0)) {
                return this.renderStubTemplate(content, data);
            }
            return '';
        });

        // Handle unescaped variables {{{variable}}}
        result = result.replace(/\{\{\{(\w+)\}\}\}/g, (match, key) => {
            const value = data[key];
            return value !== undefined ? String(value) : match;
        });

        return result;
    }

    private prepareStyles(styles: Record<string, any>): Record<string, any> {
        return {
            primaryColor: styles.primaryColor || '#007bff',
            secondaryColor: styles.secondaryColor || '#6c757d',
            fontFamily: styles.fontFamily || 'Arial, sans-serif',
            fontSize: styles.fontSize || '14px',
            backgroundColor: styles.backgroundColor || '#ffffff',
            headerImage: styles.headerImage || '',
            footerText: styles.footerText || '',
            // CSS-ready styles
            css: {
                primary: `color: ${styles.primaryColor || '#007bff'};`,
                secondary: `color: ${styles.secondaryColor || '#6c757d'};`,
                font: `font-family: ${styles.fontFamily || 'Arial, sans-serif'}; font-size: ${styles.fontSize || '14px'};`,
                background: `background-color: ${styles.backgroundColor || '#ffffff'};`,
                button: `background-color: ${styles.primaryColor || '#007bff'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;`,
                link: `color: ${styles.primaryColor || '#007bff'}; text-decoration: none;`
            }
        };
    }

    /**
     * Validate Mustache template syntax
     */
    validateTemplate(templateString: string): { valid: boolean; error?: string } {
        try {
            // Basic Mustache syntax validation
            const openTags = (templateString.match(/\{\{[#^]/g) || []).length;
            const closeTags = (templateString.match(/\{\{\//g) || []).length;

            if (openTags !== closeTags) {
                return { valid: false, error: 'Mismatched opening and closing tags' };
            }

            // Check for valid tag syntax
            const invalidTags = templateString.match(/\{\{[^}]*[^}]\}/g);
            if (invalidTags) {
                return { valid: false, error: 'Invalid tag syntax found' };
            }

            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown syntax error'
            };
        }
    }

    /**
     * Extract variables from template
     */
    extractVariables(templateString: string): string[] {
        const variables = new Set<string>();

        // Extract simple variables {{variable}}
        const simpleMatches = templateString.match(/\{\{(\w+)\}\}/g);
        if (simpleMatches) {
            simpleMatches.forEach(match => {
                const variable = match.replace(/[{}]/g, '');
                if (!variable.startsWith('#') && !variable.startsWith('^') && !variable.startsWith('/')) {
                    variables.add(variable);
                }
            });
        }

        // Extract nested variables {{object.property}}
        const nestedMatches = templateString.match(/\{\{(\w+)\.(\w+)\}\}/g);
        if (nestedMatches) {
            nestedMatches.forEach(match => {
                const parts = match.replace(/[{}]/g, '').split('.');
                variables.add(parts[0]);
            });
        }

        return Array.from(variables);
    }
}