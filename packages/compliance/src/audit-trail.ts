import {
    ImmutableAuditRecord,
    AuditEventType,
    AuditEventSeverity,
    ImmutableAuditRecordSchema
} from './types';
import {
    generateAuditHash,
    generateChainedHash,
    verifyAuditRecordIntegrity,
    verifyAuditChainIntegrity
} from './utils';

/**
 * Immutable Audit Trail Implementation
 * 
 * This module implements an immutable audit trail system with cryptographic
 * integrity verification for compliance and legal requirements.
 */

export interface AuditTrailConfig {
    enableChaining: boolean;
    enableEncryption: boolean;
    retentionDays: number;
    compressionEnabled: boolean;
    batchSize: number;
}

export interface AuditQuery {
    organizationId?: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    eventType?: AuditEventType;
    severity?: AuditEventSeverity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface AuditTrailIntegrityReport {
    totalRecords: number;
    verifiedRecords: number;
    corruptedRecords: number;
    chainIntegrityValid: boolean;
    corruptedRecordIds: string[];
    lastVerificationDate: Date;
}

/**
 * Immutable Audit Trail Manager
 */
export class ImmutableAuditTrailManager {
    private auditRecords: Map<string, ImmutableAuditRecord>;
    private config: AuditTrailConfig;
    private lastHash?: string;

    constructor(config: Partial<AuditTrailConfig> = {}) {
        this.auditRecords = new Map();
        this.config = {
            enableChaining: true,
            enableEncryption: true,
            retentionDays: 2555, // 7 years
            compressionEnabled: false,
            batchSize: 1000,
            ...config,
        };
    }

    /**
     * Create an immutable audit record
     */
    async createAuditRecord(
        eventType: AuditEventType,
        organizationId: string,
        entityType: string,
        entityId: string,
        action: string,
        details: Record<string, any>,
        options: {
            userId?: string;
            severity?: AuditEventSeverity;
            ipAddress?: string;
            userAgent?: string;
        } = {}
    ): Promise<string> {
        const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date();

        const recordData = {
            id,
            timestamp,
            eventType,
            severity: options.severity || AuditEventSeverity.LOW,
            userId: options.userId || undefined,
            organizationId,
            entityType,
            entityId,
            action,
            details,
            ipAddress: options.ipAddress || undefined,
            userAgent: options.userAgent || undefined,
        };

        // Generate hash for the record
        let hash: string;
        if (this.config.enableChaining && this.lastHash) {
            hash = generateChainedHash(recordData, this.lastHash);
        } else {
            hash = generateAuditHash(recordData);
        }

        const auditRecord: ImmutableAuditRecord = {
            ...recordData,
            hash,
            previousHash: this.config.enableChaining ? this.lastHash : undefined,
        };

        // Validate the record
        const validatedRecord = ImmutableAuditRecordSchema.parse(auditRecord);

        // Store the record
        this.auditRecords.set(id, validatedRecord);
        this.lastHash = hash;

        return id;
    }

    /**
     * Retrieve audit records by query
     */
    async queryAuditRecords(query: AuditQuery): Promise<ImmutableAuditRecord[]> {
        let records = Array.from(this.auditRecords.values());

        // Apply filters
        if (query.organizationId) {
            records = records.filter(r => r.organizationId === query.organizationId);
        }

        if (query.userId) {
            records = records.filter(r => r.userId === query.userId);
        }

        if (query.entityType) {
            records = records.filter(r => r.entityType === query.entityType);
        }

        if (query.entityId) {
            records = records.filter(r => r.entityId === query.entityId);
        }

        if (query.eventType) {
            records = records.filter(r => r.eventType === query.eventType);
        }

        if (query.severity) {
            records = records.filter(r => r.severity === query.severity);
        }

        if (query.startDate) {
            records = records.filter(r => r.timestamp >= query.startDate!);
        }

        if (query.endDate) {
            records = records.filter(r => r.timestamp <= query.endDate!);
        }

        // Sort by timestamp (newest first)
        records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Apply pagination
        if (query.offset) {
            records = records.slice(query.offset);
        }

        if (query.limit) {
            records = records.slice(0, query.limit);
        }

        return records;
    }

    /**
     * Verify the integrity of a specific audit record
     */
    async verifyRecordIntegrity(recordId: string): Promise<boolean> {
        const record = this.auditRecords.get(recordId);
        if (!record) {
            return false;
        }

        return verifyAuditRecordIntegrity(record);
    }

    /**
     * Verify the integrity of the entire audit trail
     */
    async verifyTrailIntegrity(organizationId?: string): Promise<AuditTrailIntegrityReport> {
        let records = Array.from(this.auditRecords.values());

        if (organizationId) {
            records = records.filter(r => r.organizationId === organizationId);
        }

        const totalRecords = records.length;
        let verifiedRecords = 0;
        const corruptedRecordIds: string[] = [];

        // Verify individual record integrity
        for (const record of records) {
            if (verifyAuditRecordIntegrity(record)) {
                verifiedRecords++;
            } else {
                corruptedRecordIds.push(record.id);
            }
        }

        // Verify chain integrity if chaining is enabled
        let chainIntegrityValid = true;
        if (this.config.enableChaining) {
            chainIntegrityValid = verifyAuditChainIntegrity(records);
        }

        return {
            totalRecords,
            verifiedRecords,
            corruptedRecords: totalRecords - verifiedRecords,
            chainIntegrityValid,
            corruptedRecordIds,
            lastVerificationDate: new Date(),
        };
    }

    /**
     * Generate audit trail report for compliance
     */
    async generateAuditReport(
        organizationId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        organizationId: string;
        reportPeriod: { start: Date; end: Date };
        totalEvents: number;
        eventsByType: Record<AuditEventType, number>;
        eventsBySeverity: Record<AuditEventSeverity, number>;
        uniqueUsers: number;
        integrityReport: AuditTrailIntegrityReport;
        complianceScore: number;
    }> {
        const records = await this.queryAuditRecords({
            organizationId,
            startDate,
            endDate,
        });

        const totalEvents = records.length;

        // Count events by type
        const eventsByType: Record<AuditEventType, number> = {} as any;
        for (const eventType of Object.values(AuditEventType)) {
            eventsByType[eventType] = records.filter(r => r.eventType === eventType).length;
        }

        // Count events by severity
        const eventsBySeverity: Record<AuditEventSeverity, number> = {} as any;
        for (const severity of Object.values(AuditEventSeverity)) {
            eventsBySeverity[severity] = records.filter(r => r.severity === severity).length;
        }

        // Count unique users
        const uniqueUsers = new Set(records.map(r => r.userId).filter(Boolean)).size;

        // Generate integrity report
        const integrityReport = await this.verifyTrailIntegrity(organizationId);

        // Calculate compliance score
        let complianceScore = 100;

        // Deduct points for corrupted records
        if (integrityReport.corruptedRecords > 0) {
            const corruptionRate = integrityReport.corruptedRecords / integrityReport.totalRecords;
            complianceScore -= corruptionRate * 50;
        }

        // Deduct points for chain integrity issues
        if (!integrityReport.chainIntegrityValid) {
            complianceScore -= 25;
        }

        // Deduct points for missing critical events
        const criticalEvents = records.filter(r => r.severity === AuditEventSeverity.CRITICAL).length;
        if (criticalEvents === 0 && totalEvents > 100) {
            // If there are many events but no critical ones, it might indicate incomplete logging
            complianceScore -= 10;
        }

        complianceScore = Math.max(0, Math.min(100, complianceScore));

        return {
            organizationId,
            reportPeriod: { start: startDate, end: endDate },
            totalEvents,
            eventsByType,
            eventsBySeverity,
            uniqueUsers,
            integrityReport,
            complianceScore,
        };
    }

    /**
     * Export audit records for legal or compliance purposes
     */
    async exportAuditRecords(
        query: AuditQuery,
        format: 'json' | 'csv' | 'xml' = 'json'
    ): Promise<string> {
        const records = await this.queryAuditRecords(query);

        switch (format) {
            case 'json':
                return JSON.stringify(records, null, 2);

            case 'csv':
                return this.convertToCSV(records);

            case 'xml':
                return this.convertToXML(records);

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Archive old audit records based on retention policy
     */
    async archiveOldRecords(): Promise<{
        archivedCount: number;
        remainingCount: number;
    }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

        const recordsToArchive = Array.from(this.auditRecords.entries())
            .filter(([_, record]) => record.timestamp < cutoffDate);

        // In a real implementation, these would be moved to long-term storage
        for (const [id, _] of recordsToArchive) {
            this.auditRecords.delete(id);
        }

        return {
            archivedCount: recordsToArchive.length,
            remainingCount: this.auditRecords.size,
        };
    }

    /**
     * Get audit statistics
     */
    async getAuditStatistics(organizationId?: string): Promise<{
        totalRecords: number;
        recordsByEventType: Record<AuditEventType, number>;
        recordsBySeverity: Record<AuditEventSeverity, number>;
        oldestRecord?: Date;
        newestRecord?: Date;
        averageRecordsPerDay: number;
    }> {
        let records = Array.from(this.auditRecords.values());

        if (organizationId) {
            records = records.filter(r => r.organizationId === organizationId);
        }

        const totalRecords = records.length;

        // Count by event type
        const recordsByEventType: Record<AuditEventType, number> = {} as any;
        for (const eventType of Object.values(AuditEventType)) {
            recordsByEventType[eventType] = records.filter(r => r.eventType === eventType).length;
        }

        // Count by severity
        const recordsBySeverity: Record<AuditEventSeverity, number> = {} as any;
        for (const severity of Object.values(AuditEventSeverity)) {
            recordsBySeverity[severity] = records.filter(r => r.severity === severity).length;
        }

        // Find oldest and newest records
        const timestamps = records.map(r => r.timestamp.getTime());
        const oldestRecord = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined;
        const newestRecord = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined;

        // Calculate average records per day
        let averageRecordsPerDay = 0;
        if (oldestRecord && newestRecord && totalRecords > 0) {
            const daysDiff = (newestRecord.getTime() - oldestRecord.getTime()) / (1000 * 60 * 60 * 24);
            averageRecordsPerDay = daysDiff > 0 ? totalRecords / daysDiff : totalRecords;
        }

        return {
            totalRecords,
            recordsByEventType,
            recordsBySeverity,
            oldestRecord,
            newestRecord,
            averageRecordsPerDay: Math.round(averageRecordsPerDay * 100) / 100,
        };
    }

    /**
     * Convert records to CSV format
     */
    private convertToCSV(records: ImmutableAuditRecord[]): string {
        if (records.length === 0) return '';

        const headers = [
            'ID', 'Timestamp', 'Event Type', 'Severity', 'User ID', 'Organization ID',
            'Entity Type', 'Entity ID', 'Action', 'IP Address', 'User Agent', 'Hash'
        ];

        const csvRows = [headers.join(',')];

        for (const record of records) {
            const row = [
                record.id,
                record.timestamp.toISOString(),
                record.eventType,
                record.severity,
                record.userId || '',
                record.organizationId,
                record.entityType,
                record.entityId,
                record.action,
                record.ipAddress || '',
                record.userAgent || '',
                record.hash,
            ].map(field => `"${String(field).replace(/"/g, '""')}"`);

            csvRows.push(row.join(','));
        }

        return csvRows.join('\n');
    }

    /**
     * Convert records to XML format
     */
    private convertToXML(records: ImmutableAuditRecord[]): string {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<audit_records>\n';

        for (const record of records) {
            xml += '  <record>\n';
            xml += `    <id>${record.id}</id>\n`;
            xml += `    <timestamp>${record.timestamp.toISOString()}</timestamp>\n`;
            xml += `    <event_type>${record.eventType}</event_type>\n`;
            xml += `    <severity>${record.severity}</severity>\n`;
            xml += `    <user_id>${record.userId || ''}</user_id>\n`;
            xml += `    <organization_id>${record.organizationId}</organization_id>\n`;
            xml += `    <entity_type>${record.entityType}</entity_type>\n`;
            xml += `    <entity_id>${record.entityId}</entity_id>\n`;
            xml += `    <action>${record.action}</action>\n`;
            xml += `    <ip_address>${record.ipAddress || ''}</ip_address>\n`;
            xml += `    <user_agent>${record.userAgent || ''}</user_agent>\n`;
            xml += `    <hash>${record.hash}</hash>\n`;
            xml += '  </record>\n';
        }

        xml += '</audit_records>';
        return xml;
    }

    /**
     * Get a specific audit record
     */
    getAuditRecord(recordId: string): ImmutableAuditRecord | undefined {
        return this.auditRecords.get(recordId);
    }

    /**
     * Get total number of audit records
     */
    getTotalRecords(): number {
        return this.auditRecords.size;
    }

    /**
     * Clear all audit records (for testing purposes only)
     */
    clearAllRecords(): void {
        this.auditRecords.clear();
        this.lastHash = undefined;
    }
}