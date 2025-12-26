import { EmailTemplateCustomization, TemplateError } from '../../types';
import { Logger } from 'pino';
import * as Handlebars from 'handlebars';

/**
 * Handlebars Template Renderer
 * Provides Handlebars-based email template rendering with custom helpers
 */
export class HandlebarsRenderer {
    private logger: Logger;
    private handlebars: typeof Handlebars;

    constructor(logger: Logger) {
        this.logger = logger.child({ renderer: 'handlebars' });
        this.handlebars = Handlebars.create();
        this.registerHelpers();
    }

    async render(template: EmailTemplateCustomization, data: Record<string, any>): Promise<{ html: string; text?: string; subject: string }> {
        try {
            this.logger.debug({
                templateId: template.id,
                templateName: template.name
            }, 'Rendering Handlebars template');

            // Compile templates
            const htmlTemplate = this.handlebars.compile(template.htmlTemplate);
            const subjectTemplate = this.handlebars.compile(template.subject);
            const textTemplate = template.textTemplate ? this.handlebars.compile(template.textTemplate) : null;

            // Prepare context with styles and data
            const context = {
                ...data,
                styles: this.prepareStyles(template.styles || {}),
                template: {
                    name: template.name,
                    id: template.id
                }
            };

            // Render templates
            const html = htmlTemplate(context);
            const subject = subjectTemplate(context);
            const text = textTemplate ? textTemplate(context) : undefined;

            this.logger.debug({
                templateId: template.id,
                htmlLength: html.length,
                hasText: !!text
            }, 'Handlebars template rendered successfully');

            return { html, text, subject };

        } catch (error) {
            this.logger.error({
                error,
                templateId: template.id,
                templateName: template.name
            }, 'Failed to render Handlebars template');

            throw new TemplateError(`Handlebars rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private registerHelpers(): void {
        // Date formatting helper
        this.handlebars.registerHelper('formatDate', (date: Date, format: string = 'YYYY-MM-DD') => {
            if (!date) return '';

            try {
                // Simple date formatting - in production, use a proper date library like date-fns
                const d = new Date(date);
                return d.toLocaleDateString();
            } catch (error) {
                return '';
            }
        });

        // Currency formatting helper
        this.handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
            if (typeof amount !== 'number') return '';

            try {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency
                }).format(amount);
            } catch (error) {
                return amount.toString();
            }
        });

        // Conditional helper
        this.handlebars.registerHelper('if_eq', function (this: any, a: any, b: any, options: any) {
            if (a === b) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        // String truncation helper
        this.handlebars.registerHelper('truncate', (str: string, length: number = 100) => {
            if (!str || typeof str !== 'string') return '';
            if (str.length <= length) return str;
            return str.substring(0, length) + '...';
        });

        // URL helper for safe links
        this.handlebars.registerHelper('safeUrl', (url: string) => {
            if (!url || typeof url !== 'string') return '#';

            // Basic URL validation
            try {
                new URL(url);
                return url;
            } catch (error) {
                return '#';
            }
        });

        // Loop with index helper
        this.handlebars.registerHelper('each_with_index', function (array: any[], options: any) {
            let result = '';
            for (let i = 0; i < array.length; i++) {
                result += options.fn({
                    ...array[i],
                    index: i,
                    first: i === 0,
                    last: i === array.length - 1
                });
            }
            return result;
        });

        // HTML escape helper (opposite of triple-stash)
        this.handlebars.registerHelper('escape', (str: string) => {
            if (!str || typeof str !== 'string') return '';
            return this.handlebars.escapeExpression(str);
        });

        // Capitalize helper
        this.handlebars.registerHelper('capitalize', (str: string) => {
            if (!str || typeof str !== 'string') return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        });

        // Join array helper
        this.handlebars.registerHelper('join', (array: any[], separator: string = ', ') => {
            if (!Array.isArray(array)) return '';
            return array.join(separator);
        });

        // Math helpers
        this.handlebars.registerHelper('add', (a: number, b: number) => {
            return (a || 0) + (b || 0);
        });

        this.handlebars.registerHelper('subtract', (a: number, b: number) => {
            return (a || 0) - (b || 0);
        });

        this.handlebars.registerHelper('multiply', (a: number, b: number) => {
            return (a || 0) * (b || 0);
        });

        this.handlebars.registerHelper('divide', (a: number, b: number) => {
            if (!b || b === 0) return 0;
            return (a || 0) / b;
        });

        this.logger.info('Handlebars helpers registered');
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
     * Register custom helper
     */
    registerCustomHelper(name: string, helper: Handlebars.HelperDelegate): void {
        this.handlebars.registerHelper(name, helper);
        this.logger.debug({ helperName: name }, 'Custom Handlebars helper registered');
    }

    /**
     * Register partial template
     */
    registerPartial(name: string, template: string): void {
        this.handlebars.registerPartial(name, template);
        this.logger.debug({ partialName: name }, 'Handlebars partial registered');
    }

    /**
     * Validate template syntax
     */
    validateTemplate(templateString: string): { valid: boolean; error?: string } {
        try {
            this.handlebars.compile(templateString);
            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown syntax error'
            };
        }
    }
}