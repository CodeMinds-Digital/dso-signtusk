import { SupportedLocale, RTLConfiguration, TextDirection } from './types';

// RTL language detection and configuration
export class RTLManager {
  private configurations: Map<SupportedLocale, RTLConfiguration> = new Map();

  constructor() {
    this.initializeDefaultConfigurations();
  }

  // Initialize default RTL configurations for all supported languages
  private initializeDefaultConfigurations(): void {
    // RTL languages
    const rtlLanguages = [
      SupportedLocale.AR_SA,
      SupportedLocale.AR_EG,
      SupportedLocale.HE_IL,
      SupportedLocale.FA_IR,
      SupportedLocale.UR_PK,
    ];

    // Initialize all supported locales
    Object.values(SupportedLocale).forEach(locale => {
      const isRTL = rtlLanguages.includes(locale);

      this.configurations.set(locale, {
        locale,
        direction: isRTL ? TextDirection.RTL : TextDirection.LTR,
        mirrorLayout: isRTL,
        textAlign: isRTL ? 'right' : 'left',
        iconDirection: isRTL ? 'mirrored' : 'normal',
      });
    });
  }

  // Get RTL configuration for a language
  getRTLConfiguration(locale: SupportedLocale): RTLConfiguration {
    const config = this.configurations.get(locale);
    if (!config) {
      throw new Error(`RTL configuration not found for locale: ${locale}`);
    }
    return config;
  }

  // Update RTL configuration for a language
  updateRTLConfiguration(locale: SupportedLocale, updates: Partial<RTLConfiguration>): RTLConfiguration {
    const existing = this.getRTLConfiguration(locale);
    const updated: RTLConfiguration = {
      ...existing,
      ...updates,
      locale, // Ensure locale cannot be changed
    };

    this.configurations.set(locale, updated);
    return updated;
  }

  // Check if a language is RTL
  isRTL(locale: SupportedLocale): boolean {
    return this.getRTLConfiguration(locale).direction === TextDirection.RTL;
  }

  // Get text direction for a language
  getTextDirection(locale: SupportedLocale): TextDirection {
    return this.getRTLConfiguration(locale).direction;
  }

  // Get all RTL languages
  getRTLLanguages(): SupportedLocale[] {
    return Array.from(this.configurations.entries())
      .filter(([, config]) => config.direction === TextDirection.RTL)
      .map(([locale]) => locale);
  }

  // Get all LTR languages
  getLTRLanguages(): SupportedLocale[] {
    return Array.from(this.configurations.entries())
      .filter(([, config]) => config.direction === TextDirection.LTR)
      .map(([locale]) => locale);
  }

  // Missing methods referenced in other files
  applyRTLToDocument(locale: SupportedLocale): void {
    const config = this.getRTLConfiguration(locale);
    if (typeof document !== 'undefined') {
      document.documentElement.dir = config.direction;
      document.documentElement.style.textAlign = config.textAlign;
    }
  }

  generateRTLCSS(locale: SupportedLocale): string {
    const config = this.getRTLConfiguration(locale);
    if (config.direction === TextDirection.RTL) {
      return `
        body { direction: rtl; text-align: right; }
        .ltr-override { direction: ltr; text-align: left; }
      `;
    }
    return `
      body { direction: ltr; text-align: left; }
      .rtl-override { direction: rtl; text-align: right; }
    `;
  }

  getLayoutDirection(locale: SupportedLocale): TextDirection {
    return this.getTextDirection(locale);
  }
}

// Singleton instance
export const rtlManager = new RTLManager();

// Utility functions
export function isRTLLanguage(locale: SupportedLocale): boolean {
  return rtlManager.isRTL(locale);
}

export function getTextDirection(locale: SupportedLocale): TextDirection {
  return rtlManager.getTextDirection(locale);
}