/**
 * API Deprecation Strategy
 * 
 * This module implements the deprecation strategy with timeline management,
 * automated notifications, and sunset procedures.
 */

import { APIVersion, VersionStatus } from './types';
import { versionConfig, getVersionMetadata, isVersionDeprecated, isVersionSunset } from './config';

/**
 * Deprecation notice configuration
 */
export interface DeprecationNotice {
    /** Version being deprecated */
    version: APIVersion;

    /** Deprecation announcement date */
    announcementDate: string;

    /** Date when version becomes deprecated */
    deprecationDate: string;

    /** Planned sunset date */
    sunsetDate: string;

    /** Reason for deprecation */
    reason: string;

    /** Recommended migration target */
    migrationTarget: APIVersion;

    /** Migration guide URL */
    migrationGuide: string;

    /** Support contact information */
    supportContact: string;

    /** Additional resources */
    resources: {
        documentation: string;
        examples: string;
        webinar?: string;
        faq: string;
    };
}

/**
 * Deprecation timeline phases
 */
export type DeprecationPhase =
    | 'announcement'    // Deprecation announced, version still fully supported
    | 'deprecated'      // Version marked as deprecated, warnings issued
    | 'sunset-warning'  // Final warning before sunset
    | 'sunset'          // Version no longer supported
    | 'removed';        // Version completely removed

/**
 * Deprecation timeline entry
 */
export interface DeprecationTimelineEntry {
    phase: DeprecationPhase;
    date: string;
    description: string;
    actions: string[];
    notifications: string[];
}

/**
 * Deprecation manager for handling version lifecycle
 */
export class DeprecationManager {
    /**
     * Get deprecation notice for a version
     */
    static getDeprecationNotice(version: APIVersion): DeprecationNotice | null {
        const metadata = getVersionMetadata(version);

        if (!metadata.deprecated && !metadata.sunset) {
            return null;
        }

        // This would typically come from a database or configuration
        // For now, we'll generate based on metadata
        return {
            version,
            announcementDate: this.calculateAnnouncementDate(metadata.releaseDate),
            deprecationDate: metadata.releaseDate, // Simplified
            sunsetDate: metadata.sunset || this.calculateSunsetDate(metadata.releaseDate),
            reason: 'Superseded by newer version with enhanced features and security',
            migrationTarget: this.getRecommendedMigrationTarget(version),
            migrationGuide: metadata.migrationGuide || `/api/docs/migration/${version}-to-${this.getRecommendedMigrationTarget(version)}`,
            supportContact: 'api-support@signtusk.com',
            resources: {
                documentation: `/api/docs/${version}/deprecation`,
                examples: `/api/docs/migration/${version}/examples`,
                webinar: `/resources/webinars/migrating-from-${version}`,
                faq: `/api/docs/${version}/deprecation-faq`
            }
        };
    }

    /**
     * Get deprecation timeline for a version
     */
    static getDeprecationTimeline(version: APIVersion): DeprecationTimelineEntry[] {
        const notice = this.getDeprecationNotice(version);
        if (!notice) return [];

        const timeline: DeprecationTimelineEntry[] = [
            {
                phase: 'announcement',
                date: notice.announcementDate,
                description: `Deprecation of API ${version} announced`,
                actions: [
                    'Review migration guide',
                    'Plan migration timeline',
                    'Identify affected integrations'
                ],
                notifications: [
                    'Email to registered developers',
                    'Blog post announcement',
                    'Documentation updates'
                ]
            },
            {
                phase: 'deprecated',
                date: notice.deprecationDate,
                description: `API ${version} marked as deprecated`,
                actions: [
                    'Begin migration implementation',
                    'Update client applications',
                    'Test with new version'
                ],
                notifications: [
                    'Deprecation headers in API responses',
                    'Dashboard warnings',
                    'Email reminders'
                ]
            },
            {
                phase: 'sunset-warning',
                date: this.calculateSunsetWarningDate(notice.sunsetDate),
                description: `Final warning: API ${version} sunset approaching`,
                actions: [
                    'Complete migration immediately',
                    'Verify all systems updated',
                    'Remove deprecated version usage'
                ],
                notifications: [
                    'Urgent email notifications',
                    'Dashboard alerts',
                    'API response warnings'
                ]
            },
            {
                phase: 'sunset',
                date: notice.sunsetDate,
                description: `API ${version} sunset - no longer supported`,
                actions: [
                    'Version returns 410 Gone status',
                    'Emergency migration if needed',
                    'Contact support for assistance'
                ],
                notifications: [
                    'Service disruption notices',
                    'Support ticket creation',
                    'Emergency contact procedures'
                ]
            },
            {
                phase: 'removed',
                date: this.calculateRemovalDate(notice.sunsetDate),
                description: `API ${version} completely removed`,
                actions: [
                    'All endpoints return 404',
                    'Documentation archived',
                    'Historical data cleanup'
                ],
                notifications: [
                    'Final removal notice',
                    'Archive documentation',
                    'Cleanup notifications'
                ]
            }
        ];

        return timeline;
    }

    /**
     * Get current deprecation phase for a version
     */
    static getCurrentPhase(version: APIVersion): DeprecationPhase | null {
        const timeline = this.getDeprecationTimeline(version);
        if (timeline.length === 0) return null;

        const now = new Date();

        // Find the current phase based on dates
        for (let i = timeline.length - 1; i >= 0; i--) {
            const entry = timeline[i];
            if (now >= new Date(entry.date)) {
                return entry.phase;
            }
        }

        // Before announcement
        return null;
    }

    /**
     * Get deprecation warnings for a version
     */
    static getDeprecationWarnings(version: APIVersion): string[] {
        const phase = this.getCurrentPhase(version);
        const notice = this.getDeprecationNotice(version);

        if (!phase || !notice) return [];

        const warnings: string[] = [];

        switch (phase) {
            case 'announcement':
                warnings.push(
                    `API ${version} has been announced for deprecation. ` +
                    `Sunset planned for ${notice.sunsetDate}. ` +
                    `Please plan migration to ${notice.migrationTarget}.`
                );
                break;

            case 'deprecated':
                warnings.push(
                    `API ${version} is deprecated and will be sunset on ${notice.sunsetDate}. ` +
                    `Please migrate to ${notice.migrationTarget} immediately.`
                );
                if (notice.migrationGuide) {
                    warnings.push(`Migration guide: ${notice.migrationGuide}`);
                }
                break;

            case 'sunset-warning':
                const daysUntilSunset = Math.ceil(
                    (new Date(notice.sunsetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                warnings.push(
                    `URGENT: API ${version} will be sunset in ${daysUntilSunset} days. ` +
                    `Migrate to ${notice.migrationTarget} immediately to avoid service disruption.`
                );
                break;

            case 'sunset':
                warnings.push(
                    `API ${version} has been sunset and is no longer supported. ` +
                    `Please use ${notice.migrationTarget} instead.`
                );
                break;

            case 'removed':
                warnings.push(
                    `API ${version} has been removed. ` +
                    `Use ${notice.migrationTarget} for continued service.`
                );
                break;
        }

        return warnings;
    }

    /**
     * Check if version should be blocked
     */
    static shouldBlockVersion(version: APIVersion): boolean {
        const phase = this.getCurrentPhase(version);
        return phase === 'sunset' || phase === 'removed';
    }

    /**
     * Get appropriate HTTP status for deprecated version
     */
    static getDeprecationStatus(version: APIVersion): number {
        const phase = this.getCurrentPhase(version);

        switch (phase) {
            case 'sunset':
                return 410; // Gone
            case 'removed':
                return 404; // Not Found
            default:
                return 200; // OK (with warnings)
        }
    }

    /**
     * Generate deprecation response headers
     */
    static getDeprecationHeaders(version: APIVersion): Record<string, string> {
        const headers: Record<string, string> = {};
        const notice = this.getDeprecationNotice(version);
        const phase = this.getCurrentPhase(version);

        if (!notice || !phase) return headers;

        // Standard deprecation headers
        headers['Deprecation'] = 'true';

        if (notice.sunsetDate) {
            headers['Sunset'] = notice.sunsetDate;
        }

        // Custom headers for additional information
        headers['API-Deprecation-Phase'] = phase;
        headers['API-Migration-Target'] = notice.migrationTarget;

        if (notice.migrationGuide) {
            headers['API-Migration-Guide'] = notice.migrationGuide;
        }

        // Warning header with deprecation message
        const warnings = this.getDeprecationWarnings(version);
        if (warnings.length > 0) {
            headers['Warning'] = `299 - "Deprecated API: ${warnings[0]}"`;
        }

        return headers;
    }

    /**
     * Private helper methods
     */
    private static calculateAnnouncementDate(releaseDate: string): string {
        // Announce deprecation 1 year after release
        const date = new Date(releaseDate);
        date.setFullYear(date.getFullYear() + 1);
        return date.toISOString();
    }

    private static calculateSunsetDate(releaseDate: string): string {
        // Sunset 2 years after release
        const date = new Date(releaseDate);
        date.setFullYear(date.getFullYear() + 2);
        return date.toISOString();
    }

    private static calculateSunsetWarningDate(sunsetDate: string): string {
        // Warning 3 months before sunset
        const date = new Date(sunsetDate);
        date.setMonth(date.getMonth() - 3);
        return date.toISOString();
    }

    private static calculateRemovalDate(sunsetDate: string): string {
        // Remove 6 months after sunset
        const date = new Date(sunsetDate);
        date.setMonth(date.getMonth() + 6);
        return date.toISOString();
    }

    private static getRecommendedMigrationTarget(version: APIVersion): APIVersion {
        // Simple logic - recommend latest version
        return versionConfig.latestVersion;
    }
}

/**
 * Notification service for deprecation communications
 */
export class DeprecationNotificationService {
    /**
     * Send deprecation notification to developers
     */
    static async sendDeprecationNotification(
        version: APIVersion,
        phase: DeprecationPhase,
        recipients: string[]
    ): Promise<void> {
        const notice = DeprecationManager.getDeprecationNotice(version);
        if (!notice) return;

        const subject = this.getNotificationSubject(version, phase);
        const body = this.getNotificationBody(version, phase, notice);

        // In a real implementation, this would integrate with an email service
        console.log(`Sending deprecation notification for ${version} (${phase})`);
        console.log(`Recipients: ${recipients.join(', ')}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body}`);

        // TODO: Integrate with actual email service
        // await emailService.send({
        //   to: recipients,
        //   subject,
        //   body,
        //   template: 'deprecation-notice'
        // });
    }

    /**
     * Schedule automated notifications
     */
    static scheduleNotifications(version: APIVersion): void {
        const timeline = DeprecationManager.getDeprecationTimeline(version);

        timeline.forEach(entry => {
            // In a real implementation, this would schedule jobs
            console.log(`Scheduling notification for ${version} - ${entry.phase} on ${entry.date}`);

            // TODO: Integrate with job scheduler
            // jobScheduler.schedule(entry.date, () => {
            //   this.sendDeprecationNotification(version, entry.phase, getAffectedDevelopers(version));
            // });
        });
    }

    private static getNotificationSubject(version: APIVersion, phase: DeprecationPhase): string {
        switch (phase) {
            case 'announcement':
                return `Important: API ${version} Deprecation Announcement`;
            case 'deprecated':
                return `Action Required: API ${version} Now Deprecated`;
            case 'sunset-warning':
                return `URGENT: API ${version} Sunset Approaching`;
            case 'sunset':
                return `Service Notice: API ${version} Sunset Today`;
            case 'removed':
                return `Final Notice: API ${version} Removed`;
            default:
                return `API ${version} Update`;
        }
    }

    private static getNotificationBody(
        version: APIVersion,
        phase: DeprecationPhase,
        notice: DeprecationNotice
    ): string {
        const baseMessage = `
Dear Developer,

This is an important update regarding API ${version}.

${this.getPhaseMessage(phase, notice)}

Migration Information:
- Target Version: ${notice.migrationTarget}
- Migration Guide: ${notice.migrationGuide}
- Documentation: ${notice.resources.documentation}
- Support: ${notice.supportContact}

What You Need to Do:
${this.getActionItems(phase).map(item => `- ${item}`).join('\n')}

Resources:
- Migration Examples: ${notice.resources.examples}
- FAQ: ${notice.resources.faq}
${notice.resources.webinar ? `- Migration Webinar: ${notice.resources.webinar}` : ''}

If you need assistance with migration, please contact our support team at ${notice.supportContact}.

Thank you for your attention to this matter.

Best regards,
The Signtusk API Team
    `.trim();

        return baseMessage;
    }

    private static getPhaseMessage(phase: DeprecationPhase, notice: DeprecationNotice): string {
        switch (phase) {
            case 'announcement':
                return `We are announcing the deprecation of API ${notice.version}. While the API continues to function normally, we recommend planning your migration to ${notice.migrationTarget}.`;

            case 'deprecated':
                return `API ${notice.version} is now officially deprecated. The API will continue to work until ${notice.sunsetDate}, but we strongly encourage immediate migration.`;

            case 'sunset-warning':
                return `This is your final warning: API ${notice.version} will be sunset on ${notice.sunsetDate}. After this date, the API will no longer be available.`;

            case 'sunset':
                return `API ${notice.version} has been sunset and is no longer supported. All requests to this version will return errors.`;

            case 'removed':
                return `API ${notice.version} has been completely removed from our systems. Please ensure all your applications are using ${notice.migrationTarget}.`;

            default:
                return `There has been an update to API ${notice.version}.`;
        }
    }

    private static getActionItems(phase: DeprecationPhase): string[] {
        switch (phase) {
            case 'announcement':
                return [
                    'Review the migration guide',
                    'Assess impact on your applications',
                    'Plan migration timeline',
                    'Subscribe to API updates'
                ];

            case 'deprecated':
                return [
                    'Begin migration implementation immediately',
                    'Update your applications to use the new version',
                    'Test thoroughly in your development environment',
                    'Schedule production deployment'
                ];

            case 'sunset-warning':
                return [
                    'Complete migration immediately',
                    'Verify all systems are updated',
                    'Remove any remaining references to the deprecated version',
                    'Contact support if you need emergency assistance'
                ];

            case 'sunset':
            case 'removed':
                return [
                    'Ensure all applications are using the current version',
                    'Monitor your systems for any remaining deprecated API calls',
                    'Contact support immediately if you experience issues'
                ];

            default:
                return ['Review the updated documentation'];
        }
    }
}