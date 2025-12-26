import { EmailTemplateCustomization, TemplateError } from '../../types';
import { Logger } from 'pino';
import { render } from '@react-email/render';
import React from 'react';

/**
 * React Email Template Renderer
 * Provides React-based email template rendering with JSX support
 */
export class ReactEmailRenderer {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger.child({ renderer: 'react-email' });
    }

    async render(template: EmailTemplateCustomization, data: Record<string, any>): Promise<{ html: string; text?: string; subject: string }> {
        try {
            this.logger.debug({
                templateId: template.id,
                templateName: template.name
            }, 'Rendering React Email template');

            // For this stub implementation, we'll treat the htmlTemplate as a React component string
            // In production, this would involve proper JSX compilation and component rendering

            // Prepare context with styles and data
            const context = {
                ...data,
                styles: this.prepareStyles(template.styles || {}),
                template: {
                    name: template.name,
                    id: template.id
                }
            };

            // Stub implementation - in production, this would compile and render actual React components
            const html = this.renderStubTemplate(template.htmlTemplate, context);
            const subject = this.renderStubTemplate(template.subject, context);
            const text = template.textTemplate ? this.renderStubTemplate(template.textTemplate, context) : undefined;

            this.logger.debug({
                templateId: template.id,
                htmlLength: html.length,
                hasText: !!text
            }, 'React Email template rendered successfully');

            return { html, text, subject };

        } catch (error) {
            this.logger.error({
                error,
                templateId: template.id,
                templateName: template.name
            }, 'Failed to render React Email template');

            throw new TemplateError(`React Email rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private renderStubTemplate(templateString: string, data: Record<string, any>): string {
        // Stub implementation - simple variable replacement
        // In production, this would use proper React component rendering
        let result = templateString;

        // Replace simple variables like {{variable}}
        result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || match;
        });

        // Replace nested variables like {{object.property}}
        result = result.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, obj, prop) => {
            return data[obj]?.[prop] || match;
        });

        // Replace style variables
        if (data.styles) {
            result = result.replace(/\{\{styles\.(\w+)\}\}/g, (match, key) => {
                return data.styles[key] || match;
            });
        }

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
            // React Email compatible styles
            button: {
                backgroundColor: styles.primaryColor || '#007bff',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '4px',
                display: 'inline-block'
            },
            link: {
                color: styles.primaryColor || '#007bff',
                textDecoration: 'none'
            },
            container: {
                fontFamily: styles.fontFamily || 'Arial, sans-serif',
                fontSize: styles.fontSize || '14px',
                backgroundColor: styles.backgroundColor || '#ffffff'
            }
        };
    }

    /**
     * Create a basic React Email component template
     */
    createBasicTemplate(options: {
        title: string;
        headerText?: string;
        bodyContent: string;
        footerText?: string;
        buttonText?: string;
        buttonUrl?: string;
    }): string {
        return `
import { Html, Head, Body, Container, Section, Text, Button, Img } from '@react-email/components';

export default function EmailTemplate({ 
    title = "${options.title}",
    headerText = "${options.headerText || ''}",
    bodyContent = "${options.bodyContent}",
    footerText = "${options.footerText || ''}",
    buttonText = "${options.buttonText || ''}",
    buttonUrl = "${options.buttonUrl || '#'}",
    styles = {}
}) {
    return (
        <Html>
            <Head />
            <Body style={styles.container}>
                <Container>
                    {styles.headerImage && (
                        <Section>
                            <Img src={styles.headerImage} alt="Header" />
                        </Section>
                    )}
                    
                    {headerText && (
                        <Section>
                            <Text style={{ fontSize: '24px', fontWeight: 'bold', color: styles.primaryColor }}>
                                {headerText}
                            </Text>
                        </Section>
                    )}
                    
                    <Section>
                        <Text dangerouslySetInnerHTML={{ __html: bodyContent }} />
                    </Section>
                    
                    {buttonText && buttonUrl && (
                        <Section>
                            <Button href={buttonUrl} style={styles.button}>
                                {buttonText}
                            </Button>
                        </Section>
                    )}
                    
                    {footerText && (
                        <Section>
                            <Text style={{ fontSize: '12px', color: styles.secondaryColor }}>
                                {footerText}
                            </Text>
                        </Section>
                    )}
                </Container>
            </Body>
        </Html>
    );
}`;
    }

    /**
     * Validate React component template
     */
    validateTemplate(templateString: string): { valid: boolean; error?: string } {
        try {
            // Basic JSX syntax validation
            // In production, this would use proper React/JSX parsing
            if (!templateString.includes('export default') && !templateString.includes('function')) {
                return { valid: false, error: 'Template must export a default React component' };
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
     * Generate component props interface
     */
    generatePropsInterface(variables: Array<{ name: string; type: string; required: boolean }>): string {
        const props = variables.map(v => {
            const optional = v.required ? '' : '?';
            let type = v.type;

            // Map template types to TypeScript types
            switch (v.type) {
                case 'date':
                    type = 'Date | string';
                    break;
                case 'object':
                    type = 'Record<string, any>';
                    break;
            }

            return `  ${v.name}${optional}: ${type};`;
        }).join('\n');

        return `interface EmailTemplateProps {
${props}
  styles?: Record<string, any>;
}`;
    }
}