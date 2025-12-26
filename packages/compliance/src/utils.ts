import { createHash } from 'node:crypto';
import { ImmutableAuditRecord } from './types';

/**
 * Utility functions for compliance operations
 */

/**
 * Generate a cryptographic hash for audit record immutability
 */
export function generateAuditHash(record: Omit<ImmutableAuditRecord, 'hash' | 'previousHash'>): string {
    const data = JSON.stringify({
        id: record.id,
        timestamp: record.timestamp.toISOString(),
        eventType: record.eventType,
        severity: record.severity,
        userId: record.userId || undefined,
        organizationId: record.organizationId,
        entityType: record.entityType,
        entityId: record.entityId,
        action: record.action,
        details: record.details,
        ipAddress: record.ipAddress || undefined,
        userAgent: record.userAgent || undefined,
    });

    return createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a chained hash linking to the previous audit record
 */
export function generateChainedHash(
    record: Omit<ImmutableAuditRecord, 'hash' | 'previousHash'>,
    previousHash?: string
): string {
    const recordHash = generateAuditHash(record);
    if (!previousHash) {
        return recordHash;
    }

    const chainData = `${previousHash}:${recordHash}`;
    return createHash('sha256').update(chainData).digest('hex');
}

/**
 * Verify the integrity of an audit record
 */
export function verifyAuditRecordIntegrity(record: ImmutableAuditRecord): boolean {
    const expectedHash = generateAuditHash({
        id: record.id,
        timestamp: record.timestamp,
        eventType: record.eventType,
        severity: record.severity,
        userId: record.userId || undefined,
        organizationId: record.organizationId,
        entityType: record.entityType,
        entityId: record.entityId,
        action: record.action,
        details: record.details,
        ipAddress: record.ipAddress || undefined,
        userAgent: record.userAgent || undefined,
    });

    return record.hash === expectedHash;
}

/**
 * Verify the integrity of a chain of audit records
 */
export function verifyAuditChainIntegrity(records: ImmutableAuditRecord[]): boolean {
    if (records.length === 0) return true;

    // Sort records by timestamp to ensure proper chain order
    const sortedRecords = [...records].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 0; i < sortedRecords.length; i++) {
        const record = sortedRecords[i];

        // Verify individual record integrity
        if (!verifyAuditRecordIntegrity(record)) {
            return false;
        }

        // Verify chain linkage (except for the first record)
        if (i > 0) {
            const previousRecord = sortedRecords[i - 1];
            const expectedChainedHash = generateChainedHash(
                {
                    id: record.id,
                    timestamp: record.timestamp,
                    eventType: record.eventType,
                    severity: record.severity,
                    userId: record.userId,
                    organizationId: record.organizationId,
                    entityType: record.entityType,
                    entityId: record.entityId,
                    action: record.action,
                    details: record.details,
                    ipAddress: record.ipAddress,
                    userAgent: record.userAgent,
                },
                previousRecord.hash
            );

            if (record.hash !== expectedChainedHash) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Calculate compliance score based on implemented controls
 */
export function calculateComplianceScore(
    totalControls: number,
    implementedControls: number,
    partiallyImplementedControls: number = 0
): number {
    if (totalControls === 0) return 100;

    const score = ((implementedControls + (partiallyImplementedControls * 0.5)) / totalControls) * 100;
    return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate a unique compliance report ID
 */
export function generateComplianceReportId(organizationId: string, reportType: string): string {
    const timestamp = Date.now();
    const hash = createHash('md5').update(`${organizationId}:${reportType}:${timestamp}`).digest('hex');
    return `compliance_${reportType}_${hash.substring(0, 8)}`;
}

/**
 * Validate data retention period compliance
 */
export function isDataRetentionCompliant(
    dataCreatedAt: Date,
    retentionPeriodDays: number,
    currentDate: Date = new Date()
): boolean {
    const retentionEndDate = new Date(dataCreatedAt);
    retentionEndDate.setDate(retentionEndDate.getDate() + retentionPeriodDays);

    return currentDate <= retentionEndDate;
}

/**
 * Anonymize personal data for GDPR compliance
 */
export function anonymizePersonalData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['email', 'name', 'phone', 'address', 'ssn', 'taxId'];
    const anonymized = { ...data };

    for (const field of sensitiveFields) {
        if (anonymized[field]) {
            anonymized[field] = '[ANONYMIZED]';
        }
    }

    return anonymized;
}

/**
 * Check if consent is required for data processing
 */
export function isConsentRequired(purpose: string, legalBasis: string): boolean {
    // Consent is required when the legal basis is consent
    if (legalBasis === 'consent') {
        return true;
    }

    // Consent may also be required for certain purposes even with other legal bases
    const consentRequiredPurposes = ['marketing', 'analytics', 'profiling'];
    return consentRequiredPurposes.includes(purpose.toLowerCase());
}