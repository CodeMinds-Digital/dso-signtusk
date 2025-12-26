import { z } from 'zod';
import {
    GDPRDataProcessingRecord,
    GDPRLegalBasis,
    DataProcessingPurpose,
    GDPRDataProcessingRecordSchema
} from './types';
import { isDataRetentionCompliant, anonymizePersonalData, isConsentRequired } from './utils';

/**
 * GDPR Compliance Implementation
 * 
 * This module implements GDPR (General Data Protection Regulation) compliance
 * with privacy by design principles for the Signtusk platform.
 */

export interface GDPRConsentRecord {
    id: string;
    dataSubject: string;
    purpose: DataProcessingPurpose;
    consentGiven: boolean;
    consentDate: Date;
    consentWithdrawn?: boolean;
    withdrawalDate?: Date;
    consentMethod: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
    ipAddress?: string;
    userAgent?: string;
}

export interface GDPRDataSubjectRequest {
    id: string;
    dataSubject: string;
    requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
    requestDate: Date;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    completedDate?: Date;
    rejectionReason?: string;
    requestedBy: string;
    processedBy?: string;
}

export interface GDPRDataBreachRecord {
    id: string;
    organizationId: string;
    breachDate: Date;
    discoveryDate: Date;
    reportedDate?: Date;
    affectedDataSubjects: number;
    dataTypes: string[];
    breachDescription: string;
    containmentMeasures: string[];
    notificationRequired: boolean;
    authorityNotified: boolean;
    dataSubjectsNotified: boolean;
    riskLevel: 'low' | 'medium' | 'high';
}

/**
 * GDPR Compliance Manager
 */
export class GDPRComplianceManager {
    private processingRecords: Map<string, GDPRDataProcessingRecord>;
    private consentRecords: Map<string, GDPRConsentRecord>;
    private dataSubjectRequests: Map<string, GDPRDataSubjectRequest>;
    private dataBreaches: Map<string, GDPRDataBreachRecord>;

    constructor() {
        this.processingRecords = new Map();
        this.consentRecords = new Map();
        this.dataSubjectRequests = new Map();
        this.dataBreaches = new Map();
    }

    /**
     * Record data processing activity
     */
    async recordDataProcessing(record: Omit<GDPRDataProcessingRecord, 'id'>): Promise<string> {
        const id = `processing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const processingRecord: GDPRDataProcessingRecord = {
            id,
            ...record,
        };

        // Validate the record
        const validatedRecord = GDPRDataProcessingRecordSchema.parse(processingRecord);

        this.processingRecords.set(id, validatedRecord);
        return id;
    }

    /**
     * Record consent given by data subject
     */
    async recordConsent(
        dataSubject: string,
        purpose: DataProcessingPurpose,
        consentMethod: 'explicit' | 'implicit' | 'opt_in' | 'opt_out',
        ipAddress?: string,
        userAgent?: string
    ): Promise<string> {
        const id = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const consentRecord: GDPRConsentRecord = {
            id,
            dataSubject,
            purpose,
            consentGiven: true,
            consentDate: new Date(),
            consentMethod,
            ipAddress,
            userAgent,
        };

        this.consentRecords.set(id, consentRecord);
        return id;
    }

    /**
     * Record consent withdrawal
     */
    async withdrawConsent(consentId: string): Promise<boolean> {
        const consentRecord = this.consentRecords.get(consentId);
        if (!consentRecord) {
            return false;
        }

        consentRecord.consentWithdrawn = true;
        consentRecord.withdrawalDate = new Date();

        this.consentRecords.set(consentId, consentRecord);
        return true;
    }

    /**
     * Handle data subject access request (Article 15)
     */
    async handleAccessRequest(dataSubject: string, requestedBy: string): Promise<string> {
        const requestId = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const request: GDPRDataSubjectRequest = {
            id: requestId,
            dataSubject,
            requestType: 'access',
            requestDate: new Date(),
            status: 'pending',
            requestedBy,
        };

        this.dataSubjectRequests.set(requestId, request);

        // Process the request (in a real implementation, this would be more complex)
        await this.processAccessRequest(requestId);

        return requestId;
    }

    /**
     * Handle data subject erasure request - "Right to be Forgotten" (Article 17)
     */
    async handleErasureRequest(dataSubject: string, requestedBy: string): Promise<string> {
        const requestId = `erasure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const request: GDPRDataSubjectRequest = {
            id: requestId,
            dataSubject,
            requestType: 'erasure',
            requestDate: new Date(),
            status: 'pending',
            requestedBy,
        };

        this.dataSubjectRequests.set(requestId, request);

        // Process the request
        await this.processErasureRequest(requestId);

        return requestId;
    }

    /**
     * Handle data portability request (Article 20)
     */
    async handlePortabilityRequest(dataSubject: string, requestedBy: string): Promise<string> {
        const requestId = `portability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const request: GDPRDataSubjectRequest = {
            id: requestId,
            dataSubject,
            requestType: 'portability',
            requestDate: new Date(),
            status: 'pending',
            requestedBy,
        };

        this.dataSubjectRequests.set(requestId, request);

        // Process the request
        await this.processPortabilityRequest(requestId);

        return requestId;
    }

    /**
     * Report a data breach
     */
    async reportDataBreach(breach: Omit<GDPRDataBreachRecord, 'id'>): Promise<string> {
        const id = `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const breachRecord: GDPRDataBreachRecord = {
            id,
            ...breach,
        };

        this.dataBreaches.set(id, breachRecord);

        // Check if notification is required (within 72 hours)
        const timeSinceDiscovery = Date.now() - breach.discoveryDate.getTime();
        const hoursElapsed = timeSinceDiscovery / (1000 * 60 * 60);

        if (hoursElapsed > 72 && !breach.authorityNotified) {
            // Log compliance violation
            console.warn(`GDPR Compliance Warning: Data breach ${id} not reported within 72 hours`);
        }

        return id;
    }

    /**
     * Check if data processing is lawful
     */
    isProcessingLawful(
        purpose: DataProcessingPurpose,
        legalBasis: GDPRLegalBasis,
        consentGiven?: boolean
    ): boolean {
        // If legal basis is consent, consent must be given
        if (legalBasis === GDPRLegalBasis.CONSENT) {
            return consentGiven === true;
        }

        // For other legal bases, check if they're appropriate for the purpose
        switch (purpose) {
            case DataProcessingPurpose.AUTHENTICATION:
                return [GDPRLegalBasis.CONTRACT, GDPRLegalBasis.LEGITIMATE_INTERESTS].includes(legalBasis);

            case DataProcessingPurpose.DOCUMENT_PROCESSING:
            case DataProcessingPurpose.SIGNATURE_VERIFICATION:
                return [GDPRLegalBasis.CONTRACT, GDPRLegalBasis.LEGAL_OBLIGATION].includes(legalBasis);

            case DataProcessingPurpose.AUDIT_LOGGING:
                return [GDPRLegalBasis.LEGAL_OBLIGATION, GDPRLegalBasis.LEGITIMATE_INTERESTS].includes(legalBasis);

            case DataProcessingPurpose.MARKETING:
                return [GDPRLegalBasis.LEGITIMATE_INTERESTS].includes(legalBasis);

            case DataProcessingPurpose.ANALYTICS:
                return [GDPRLegalBasis.CONSENT, GDPRLegalBasis.LEGITIMATE_INTERESTS].includes(legalBasis);

            case DataProcessingPurpose.SUPPORT:
                return [GDPRLegalBasis.CONTRACT, GDPRLegalBasis.LEGITIMATE_INTERESTS].includes(legalBasis);

            default:
                return false;
        }
    }

    /**
     * Check data retention compliance
     */
    checkDataRetentionCompliance(organizationId: string): {
        compliant: boolean;
        expiredRecords: GDPRDataProcessingRecord[];
    } {
        const expiredRecords: GDPRDataProcessingRecord[] = [];
        let compliant = true;

        for (const record of this.processingRecords.values()) {
            if (!isDataRetentionCompliant(record.processingDate, record.retentionPeriod)) {
                expiredRecords.push(record);
                compliant = false;
            }
        }

        return { compliant, expiredRecords };
    }

    /**
     * Generate GDPR compliance report
     */
    async generateComplianceReport(organizationId: string): Promise<{
        organizationId: string;
        reportDate: Date;
        totalProcessingRecords: number;
        activeConsents: number;
        withdrawnConsents: number;
        pendingRequests: number;
        completedRequests: number;
        dataBreaches: number;
        complianceScore: number;
        recommendations: string[];
    }> {
        const activeConsents = Array.from(this.consentRecords.values())
            .filter(c => c.consentGiven && !c.consentWithdrawn).length;

        const withdrawnConsents = Array.from(this.consentRecords.values())
            .filter(c => c.consentWithdrawn).length;

        const pendingRequests = Array.from(this.dataSubjectRequests.values())
            .filter(r => r.status === 'pending' || r.status === 'processing').length;

        const completedRequests = Array.from(this.dataSubjectRequests.values())
            .filter(r => r.status === 'completed').length;

        const dataBreaches = this.dataBreaches.size;

        // Calculate compliance score based on various factors
        let score = 100;

        // Deduct points for pending requests older than 30 days
        const oldPendingRequests = Array.from(this.dataSubjectRequests.values())
            .filter(r => {
                const daysSinceRequest = (Date.now() - r.requestDate.getTime()) / (1000 * 60 * 60 * 24);
                return (r.status === 'pending' || r.status === 'processing') && daysSinceRequest > 30;
            }).length;

        score -= oldPendingRequests * 10;

        // Deduct points for data breaches not reported within 72 hours
        const lateReportedBreaches = Array.from(this.dataBreaches.values())
            .filter(b => {
                const hoursToReport = (b.reportedDate?.getTime() || Date.now()) - b.discoveryDate.getTime();
                return hoursToReport > (72 * 60 * 60 * 1000);
            }).length;

        score -= lateReportedBreaches * 20;

        // Check data retention compliance
        const retentionCheck = this.checkDataRetentionCompliance(organizationId);
        if (!retentionCheck.compliant) {
            score -= retentionCheck.expiredRecords.length * 5;
        }

        score = Math.max(0, Math.min(100, score));

        // Generate recommendations
        const recommendations: string[] = [];

        if (oldPendingRequests > 0) {
            recommendations.push(`Process ${oldPendingRequests} overdue data subject requests`);
        }

        if (lateReportedBreaches > 0) {
            recommendations.push('Improve data breach notification procedures to meet 72-hour requirement');
        }

        if (!retentionCheck.compliant) {
            recommendations.push(`Delete or anonymize ${retentionCheck.expiredRecords.length} expired data records`);
        }

        if (activeConsents === 0 && this.processingRecords.size > 0) {
            recommendations.push('Review consent management processes for data processing activities');
        }

        return {
            organizationId,
            reportDate: new Date(),
            totalProcessingRecords: this.processingRecords.size,
            activeConsents,
            withdrawnConsents,
            pendingRequests,
            completedRequests,
            dataBreaches,
            complianceScore: score,
            recommendations,
        };
    }

    /**
     * Process access request
     */
    private async processAccessRequest(requestId: string): Promise<void> {
        const request = this.dataSubjectRequests.get(requestId);
        if (!request) return;

        request.status = 'processing';
        this.dataSubjectRequests.set(requestId, request);

        // Simulate processing time
        setTimeout(() => {
            request.status = 'completed';
            request.completedDate = new Date();
            request.processedBy = 'system';
            this.dataSubjectRequests.set(requestId, request);
        }, 1000);
    }

    /**
     * Process erasure request
     */
    private async processErasureRequest(requestId: string): Promise<void> {
        const request = this.dataSubjectRequests.get(requestId);
        if (!request) return;

        request.status = 'processing';
        this.dataSubjectRequests.set(requestId, request);

        // Find and anonymize/delete data for the data subject
        for (const [id, record] of this.processingRecords) {
            if (record.dataSubject === request.dataSubject) {
                // In a real implementation, this would delete or anonymize the data
                this.processingRecords.delete(id);
            }
        }

        // Complete the request
        setTimeout(() => {
            request.status = 'completed';
            request.completedDate = new Date();
            request.processedBy = 'system';
            this.dataSubjectRequests.set(requestId, request);
        }, 1000);
    }

    /**
     * Process portability request
     */
    private async processPortabilityRequest(requestId: string): Promise<void> {
        const request = this.dataSubjectRequests.get(requestId);
        if (!request) return;

        request.status = 'processing';
        this.dataSubjectRequests.set(requestId, request);

        // Simulate data export generation
        setTimeout(() => {
            request.status = 'completed';
            request.completedDate = new Date();
            request.processedBy = 'system';
            this.dataSubjectRequests.set(requestId, request);
        }, 2000);
    }

    /**
     * Get all processing records for a data subject
     */
    getDataSubjectProcessingRecords(dataSubject: string): GDPRDataProcessingRecord[] {
        return Array.from(this.processingRecords.values())
            .filter(record => record.dataSubject === dataSubject);
    }

    /**
     * Get all consent records for a data subject
     */
    getDataSubjectConsentRecords(dataSubject: string): GDPRConsentRecord[] {
        return Array.from(this.consentRecords.values())
            .filter(record => record.dataSubject === dataSubject);
    }

    /**
     * Check if consent is valid for a specific purpose
     */
    hasValidConsent(dataSubject: string, purpose: DataProcessingPurpose): boolean {
        const consentRecords = this.getDataSubjectConsentRecords(dataSubject);

        return consentRecords.some(consent =>
            consent.purpose === purpose &&
            consent.consentGiven &&
            !consent.consentWithdrawn
        );
    }
}