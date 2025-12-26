import { z } from 'zod';
import Color from 'color';
import {
    BrandingConfig,
    BrandingConfigSchema,
    ColorPalette,
    Typography,
    LogoConfig,
    CustomCSS,
    BrandingPreview,
    ThemeGenerationOptions,
    GeneratedTheme,
    ThemeVariables
} from './types';

export interface BrandingServiceOptions {
    storageService: any; // Will be injected
    databaseService: any; // Will be injected
    previewBaseUrl: string;
}

export class BrandingService {
    private storageService: any;
    private databaseService: any;
    private previewBaseUrl: string;

    constructor(options: BrandingServiceOptions) {
        this.storageService = options.storageService;
        this.databaseService = options.databaseService;
        this.previewBaseUrl = options.previewBaseUrl;
    }

    // ============================================================================
    // BRANDING CONFIGURATION MANAGEMENT
    // ============================================================================

    async createBrandingConfig(config: Omit<BrandingConfig, 'createdAt' | 'updatedAt' | 'version'>): Promise<BrandingConfig> {
        // Validate the configuration
        const validatedConfig = BrandingConfigSchema.parse({
            ...config,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Validate color accessibility
        await this.validateColorAccessibility(validatedConfig.colors);

        // Generate CSS variables and theme
        const generatedTheme = await this.generateTheme(validatedConfig);

        // Store in database
        const savedConfig = await this.databaseService.brandingConfig.create({
            data: validatedConfig,
        });

        // Store generated theme
        await this.databaseService.generatedTheme.create({
            data: {
                ...generatedTheme,
                brandingId: savedConfig.id,
            },
        });

        return savedConfig;
    }

    async updateBrandingConfig(
        brandingId: string,
        updates: Partial<BrandingConfig>
    ): Promise<BrandingConfig> {
        const existingConfig = await this.getBrandingConfig(brandingId);
        if (!existingConfig) {
            throw new Error('Branding configuration not found');
        }

        // Merge updates with existing config
        const updatedConfig = {
            ...existingConfig,
            ...updates,
            version: existingConfig.version + 1,
            updatedAt: new Date(),
        };

        // Validate the updated configuration
        const validatedConfig = BrandingConfigSchema.parse(updatedConfig);

        // Validate color accessibility if colors were updated
        if (updates.colors) {
            await this.validateColorAccessibility(validatedConfig.colors);
        }

        // Regenerate theme if necessary
        if (this.shouldRegenerateTheme(updates)) {
            const generatedTheme = await this.generateTheme(validatedConfig);

            await this.databaseService.generatedTheme.upsert({
                where: { brandingId },
                update: {
                    ...generatedTheme,
                    version: validatedConfig.version,
                },
                create: {
                    ...generatedTheme,
                    brandingId,
                },
            });
        }

        // Update in database
        const savedConfig = await this.databaseService.brandingConfig.update({
            where: { id: brandingId },
            data: validatedConfig,
        });

        return savedConfig;
    }

    async getBrandingConfig(brandingId: string): Promise<BrandingConfig | null> {
        return await this.databaseService.brandingConfig.findUnique({
            where: { id: brandingId },
        });
    }

    async getBrandingConfigByOrganization(organizationId: string): Promise<BrandingConfig | null> {
        return await this.databaseService.brandingConfig.findFirst({
            where: {
                organizationId,
                isActive: true,
            },
            orderBy: { version: 'desc' },
        });
    }

    async deleteBrandingConfig(brandingId: string): Promise<void> {
        // Soft delete by marking as inactive
        await this.databaseService.brandingConfig.update({
            where: { id: brandingId },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });

        // Also mark generated theme as inactive
        await this.databaseService.generatedTheme.updateMany({
            where: { brandingId },
            data: { isActive: false },
        });
    }

    // ============================================================================
    // COLOR MANAGEMENT AND VALIDATION
    // ============================================================================

    async validateColorAccessibility(colors: ColorPalette): Promise<void> {
        const contrastChecks = [
            { bg: colors.background, fg: colors.text, name: 'Background/Text' },
            { bg: colors.primary, fg: colors.background, name: 'Primary/Background' },
            { bg: colors.secondary, fg: colors.background, name: 'Secondary/Background' },
            { bg: colors.surface, fg: colors.text, name: 'Surface/Text' },
        ];

        const failedChecks: string[] = [];

        for (const check of contrastChecks) {
            const contrast = Color(check.bg).contrast(Color(check.fg));

            // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
            if (contrast < 4.5) {
                failedChecks.push(`${check.name}: ${contrast.toFixed(2)}:1 (minimum 4.5:1)`);
            }
        }

        if (failedChecks.length > 0) {
            throw new Error(`Color accessibility validation failed:\n${failedChecks.join('\n')}`);
        }
    }

    generateColorVariations(baseColor: string): Record<string, string> {
        const color = Color(baseColor);

        return {
            50: color.lighten(0.95).hex(),
            100: color.lighten(0.9).hex(),
            200: color.lighten(0.75).hex(),
            300: color.lighten(0.6).hex(),
            400: color.lighten(0.3).hex(),
            500: color.hex(), // Base color
            600: color.darken(0.1).hex(),
            700: color.darken(0.2).hex(),
            800: color.darken(0.3).hex(),
            900: color.darken(0.4).hex(),
        };
    }

    // ============================================================================
    // THEME GENERATION
    // ============================================================================

    async generateTheme(
        config: BrandingConfig,
        options: ThemeGenerationOptions = {
            includeAnimations: true,
            includeFonts: true,
            includeCustomCSS: true,
            minify: false,
            format: 'css',
        }
    ): Promise<GeneratedTheme> {
        const variables = this.generateCSSVariables(config);
        const css = this.generateCSS(config, variables, options);
        const tailwindConfig = this.generateTailwindConfig(config);

        return {
            brandingId: config.organizationId, // Will be updated with actual branding ID
            css,
            variables,
            tailwindConfig,
            version: config.version,
            generatedAt: new Date(),
        };
    }

    private generateCSSVariables(config: BrandingConfig): ThemeVariables {
        const colors: Record<string, string> = {};
        const typography: Record<string, string> = {};
        const spacing: Record<string, string> = {};
        const shadows: Record<string, string> = {};
        const borders: Record<string, string> = {};
        const animations: Record<string, string> = {};

        // Color variables
        Object.entries(config.colors).forEach(([key, value]) => {
            colors[`--color-${this.kebabCase(key)}`] = value;

            // Generate color variations
            const variations = this.generateColorVariations(value);
            Object.entries(variations).forEach(([shade, color]) => {
                colors[`--color-${this.kebabCase(key)}-${shade}`] = color;
            });
        });

        // Typography variables
        typography['--font-family'] = config.typography.fontFamily;
        if (config.typography.headingFontFamily) {
            typography['--font-family-heading'] = config.typography.headingFontFamily;
        }

        Object.entries(config.typography.fontSize).forEach(([key, value]) => {
            typography[`--font-size-${key}`] = value;
        });

        Object.entries(config.typography.fontWeight).forEach(([key, value]) => {
            typography[`--font-weight-${key}`] = value.toString();
        });

        Object.entries(config.typography.lineHeight).forEach(([key, value]) => {
            typography[`--line-height-${key}`] = value.toString();
        });

        // Border radius
        const borderRadiusMap = {
            none: '0',
            sm: '0.125rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
        };
        borders['--border-radius'] = borderRadiusMap[config.borderRadius];

        // Spacing variables (basic set)
        spacing['--spacing-xs'] = '0.25rem';
        spacing['--spacing-sm'] = '0.5rem';
        spacing['--spacing-md'] = '1rem';
        spacing['--spacing-lg'] = '1.5rem';
        spacing['--spacing-xl'] = '2rem';

        // Shadow variables
        shadows['--shadow-sm'] = '0 1px 2px rgba(0, 0, 0, 0.05)';
        shadows['--shadow-md'] = '0 1px 3px rgba(0, 0, 0, 0.1)';
        shadows['--shadow-lg'] = '0 4px 6px rgba(0, 0, 0, 0.1)';

        // Animation variables
        if (config.animations) {
            animations['--transition-fast'] = '0.15s ease-in-out';
            animations['--transition-normal'] = '0.3s ease-in-out';
            animations['--transition-slow'] = '0.5s ease-in-out';
        }

        return {
            colors,
            typography,
            spacing,
            shadows,
            borders,
            animations,
        };
    }

    private generateCSS(
        config: BrandingConfig,
        variables: ThemeVariables,
        options: ThemeGenerationOptions
    ): string {
        let css = ':root {\n';

        // Add CSS variables from all categories
        Object.entries(variables.colors).forEach(([key, value]) => {
            css += `  ${key}: ${value};\n`;
        });

        Object.entries(variables.typography).forEach(([key, value]) => {
            css += `  ${key}: ${value};\n`;
        });

        Object.entries(variables.spacing).forEach(([key, value]) => {
            css += `  ${key}: ${value};\n`;
        });

        Object.entries(variables.shadows).forEach(([key, value]) => {
            css += `  ${key}: ${value};\n`;
        });

        Object.entries(variables.borders).forEach(([key, value]) => {
            css += `  ${key}: ${value};\n`;
        });

        Object.entries(variables.animations).forEach(([key, value]) => {
            css += `  ${key}: ${value};\n`;
        });

        css += '}\n\n';

        // Add base styles
        css += this.generateBaseStyles(config, options);

        // Add component styles
        css += this.generateComponentStyles(config, options);

        // Add custom CSS if provided
        if (options.includeCustomCSS && config.customCSS?.global) {
            css += '\n/* Custom CSS */\n';
            css += config.customCSS.global;
            css += '\n';
        }

        // Add animations if enabled
        if (options.includeAnimations && config.animations) {
            css += this.generateAnimations();
        }

        return options.minify ? this.minifyCSS(css) : css;
    }

    private generateBaseStyles(config: BrandingConfig, options: ThemeGenerationOptions): string {
        return `
/* Base Styles */
* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  color: var(--color-text);
  background-color: var(--color-background);
  line-height: var(--line-height-normal);
  margin: 0;
  padding: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-family-heading, var(--font-family));
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin: 0 0 1rem 0;
}

h1 { font-size: var(--font-size-4xl); }
h2 { font-size: var(--font-size-3xl); }
h3 { font-size: var(--font-size-2xl); }
h4 { font-size: var(--font-size-xl); }
h5 { font-size: var(--font-size-lg); }
h6 { font-size: var(--font-size-base); }

p {
  margin: 0 0 1rem 0;
  line-height: var(--line-height-relaxed);
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  color: var(--color-primary-600);
  text-decoration: underline;
}
`;
    }

    private generateComponentStyles(config: BrandingConfig, options: ThemeGenerationOptions): string {
        return `
/* Component Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-background);
}

.btn-primary:hover {
  background-color: var(--color-primary-600);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-background);
}

.btn-secondary:hover {
  background-color: var(--color-secondary-600);
}

.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  background-color: var(--color-background);
  color: var(--color-text);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-200);
}
`;
    }

    private generateAnimations(): string {
        return `
/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-in-out;
}

.animate-pulse {
  animation: pulse 2s infinite;
}
`;
    }

    private generateTailwindConfig(config: BrandingConfig): Record<string, any> {
        return {
            theme: {
                extend: {
                    colors: {
                        primary: this.generateColorVariations(config.colors.primary),
                        secondary: this.generateColorVariations(config.colors.secondary),
                        accent: this.generateColorVariations(config.colors.accent),
                        background: config.colors.background,
                        surface: config.colors.surface,
                        text: config.colors.text,
                        'text-secondary': config.colors.textSecondary,
                        border: config.colors.border,
                        success: config.colors.success,
                        warning: config.colors.warning,
                        error: config.colors.error,
                        info: config.colors.info,
                    },
                    fontFamily: {
                        sans: [config.typography.fontFamily, 'system-ui', 'sans-serif'],
                        heading: config.typography.headingFontFamily
                            ? [config.typography.headingFontFamily, config.typography.fontFamily, 'system-ui', 'sans-serif']
                            : [config.typography.fontFamily, 'system-ui', 'sans-serif'],
                    },
                    fontSize: config.typography.fontSize,
                    fontWeight: config.typography.fontWeight,
                    lineHeight: config.typography.lineHeight,
                    borderRadius: {
                        DEFAULT: config.borderRadius === 'none' ? '0' :
                            config.borderRadius === 'sm' ? '0.125rem' :
                                config.borderRadius === 'md' ? '0.375rem' :
                                    config.borderRadius === 'lg' ? '0.5rem' : '0.75rem',
                    },
                },
            },
        };
    }

    // ============================================================================
    // PREVIEW GENERATION
    // ============================================================================

    async generatePreview(brandingId: string): Promise<BrandingPreview> {
        const config = await this.getBrandingConfig(brandingId);
        if (!config) {
            throw new Error('Branding configuration not found');
        }

        // Generate preview HTML
        const previewHtml = await this.generatePreviewHTML(config);

        // Store preview file
        const previewFilename = `preview-${brandingId}-${Date.now()}.html`;
        const previewUrl = await this.storageService.uploadFile(
            `previews/${previewFilename}`,
            Buffer.from(previewHtml, 'utf-8'),
            'text/html'
        );

        // Generate thumbnail (would use a headless browser in real implementation)
        const thumbnailUrl = await this.generatePreviewThumbnail(previewUrl);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

        return {
            brandingId,
            previewUrl,
            thumbnailUrl,
            generatedAt: new Date(),
            expiresAt,
        };
    }

    private async generatePreviewHTML(config: BrandingConfig): Promise<string> {
        const theme = await this.generateTheme(config);

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Branding Preview</title>
    <style>
        ${theme.css}
    </style>
</head>
<body>
    <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
        <header style="margin-bottom: 2rem;">
            <img src="${config.logos.primary.url}" alt="${config.logos.primary.alt}" 
                 style="height: 60px; margin-bottom: 1rem;">
            <h1>Welcome to Your Platform</h1>
            <p>This is a preview of your custom branding configuration.</p>
        </header>
        
        <main>
            <div class="card" style="margin-bottom: 2rem;">
                <h2>Sample Content</h2>
                <p>This demonstrates how your branding will look across the platform.</p>
                <div style="margin: 1rem 0;">
                    <button class="btn btn-primary" style="margin-right: 1rem;">Primary Button</button>
                    <button class="btn btn-secondary">Secondary Button</button>
                </div>
            </div>
            
            <div class="card">
                <h3>Form Elements</h3>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: var(--font-weight-medium);">
                        Sample Input
                    </label>
                    <input class="input" type="text" placeholder="Enter text here..." />
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: var(--font-weight-medium);">
                        Sample Textarea
                    </label>
                    <textarea class="input" rows="3" placeholder="Enter message here..."></textarea>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
    `;
    }

    private async generatePreviewThumbnail(previewUrl: string): Promise<string> {
        // In a real implementation, this would use a headless browser like Puppeteer
        // to generate a screenshot of the preview
        // For now, return a placeholder
        return `${this.previewBaseUrl}/thumbnails/placeholder.png`;
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    private shouldRegenerateTheme(updates: Partial<BrandingConfig>): boolean {
        const themeAffectingFields = [
            'colors', 'typography', 'theme', 'borderRadius',
            'animations', 'customCSS'
        ];

        return themeAffectingFields.some(field => field in updates);
    }

    private kebabCase(str: string): string {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    private minifyCSS(css: string): string {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
            .replace(/\s*{\s*/g, '{') // Remove spaces around opening brace
            .replace(/;\s*/g, ';') // Remove spaces after semicolon
            .trim();
    }
}