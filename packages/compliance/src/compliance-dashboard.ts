import {
    ComplianceReport,
    ComplianceStatus,
    ComplianceReportSchema,
    AuditEventSeverity,
    ComplianceConfig
} from './types';
import { SOC2ComplianceManager } from './soc2';
import { GDPRComplianceManager } from './gdpr';
import { ImmutableAuditTrailManager } from './audit-trail';
import { generateComplianceReportId } from './utils';

/**
 * Compliance Dashboard Implementation
 * 
 * This module provides a comprehensive compliance dashboard with reporting
 * and certification management for SOC 2, GDPR, and other regulations.
 */

export interface ComplianceCertification {
    id: string;
    name: string;
    type: 'soc2' | 'gdpr' | 'iso27001' | 'hipaa' | 'pci_dss';
    status: ComplianceStatus;
    issuedDate?: Date;
    validUntil?: Date;
    certificateUrl?: string;
    issuer?: string;
    scope?: string;
    lastAuditDate?: Date;
    nextAuditDate?: Date;
}

export interface ComplianceDashboardMetrics {
    overallScore: number;
    soc2Score: number;
    gdprScore: number;
    auditTrailScore: number;
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    activeCertifications: number;
    expiringSoonCertifications: number;
    lastAssessmentDate: Date;
    nextAssessmentDue: Date;
}

export interface ComplianceFinding {
    id: string;
    type: 'soc2' | 'gdpr' | 'audit' | 'general';
    severity: AuditEventSeverity;
    title: string;
    description: string;
    recommendation: string;
    status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
    discoveredDate: Date;
    resolvedDate?: Date;
    assignedTo?: string;
    dueDate?: Date;
}

/**
 * Compliance Dashboard Manager
 */
export class ComplianceDashboardManager {
    private soc2Manager: SOC2ComplianceManager;
    private gdprManager: GDPRComplianceManager;
    private auditManager: ImmutableAuditTrailManager;
    private certifications: Map<string, ComplianceCertification>;
    private findings: Map<string, ComplianceFinding>;
    private config: ComplianceConfig;

    constructor(
        soc2Manager: SOC2ComplianceManager,
        gdprManager: GDPRComplianceManager,
        auditManager: ImmutableAuditTrailManager,
        config: ComplianceConfig
    ) {
        this.soc2Manager = soc2Manager;
        this.gdprManager = gdprManager;
        this.auditManager = auditManager;
        this.certifications = new Map();
        this.findings = new Map();
        this.config = config;
    }

    /**
     * Generate comprehensive compliance report
     */
    async generateComprehensiveReport(organizationId: string): Promise<ComplianceReport> {
        const reportId = generateComplianceReportId(organizationId, 'comprehensive');

        // Get individual compliance reports
        const soc2Report = await this.soc2Manager.generateComplianceReport(organizationId);
        const gdprReport = await this.gdprManager.generateComplianceReport(organizationId);

        // Get audit trail report for the last 90 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        const auditReport = await this.auditManager.generateAuditReport(organizationId, startDate, endDate);

        // Calculate overall compliance score
        const overallScore = Math.round(
            (soc2Report.overallScore + gdprReport.complianceScore + auditReport.complianceScore) / 3
        );

        // Determine overall status
        let status: ComplianceStatus;
        if (overallScore >= 90) {
            status = ComplianceStatus.COMPLIANT;
        } else if (overallScore >= 70) {
            status = ComplianceStatus.PARTIALLY_COMPLIANT;
        } else {
            status = ComplianceStatus.NON_COMPLIANT;
        }

        // Compile findings
        const findings: ComplianceReport['findings'] = [];

        // Add SOC 2 findings
        soc2Report.recommendations.forEach(rec => {
            findings.push({
                type: 'soc2',
                severity: AuditEventSeverity.MEDIUM,
                description: rec,
                recommendation: rec,
            });
        });

        // Add GDPR findings
        gdprReport.recommendations.forEach(rec => {
            findings.push({
                type: 'gdpr',
                severity: AuditEventSeverity.HIGH,
                description: rec,
                recommendation: rec,
            });
        });

        // Add audit trail findings
        if (auditReport.integrityReport.corruptedRecords > 0) {
            findings.push({
                type: 'audit',
                severity: AuditEventSeverity.CRITICAL,
                description: `${auditReport.integrityReport.corruptedRecords} corrupted audit records detected`,
                recommendation: 'Investigate and restore audit trail integrity',
            });
        }

        // Get certifications
        const certifications = Array.from(this.certifications.values()).map(cert => ({
            name: cert.name,
            status: cert.status,
            validUntil: cert.validUntil,
            certificateUrl: cert.certificateUrl,
        }));

        const report: ComplianceReport = {
            id: reportId,
            organizationId,
            reportType: 'comprehensive',
            status,
            score: overallScore,
            generatedAt: new Date(),
            generatedBy: 'system',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            findings,
            certifications,
        };

        // Validate the report
        return ComplianceReportSchema.parse(report);
    }

    /**
     * Get dashboard metrics
     */
    async getDashboardMetrics(organizationId: string): Promise<ComplianceDashboardMetrics> {
        // Get individual compliance scores
        const soc2Report = await this.soc2Manager.generateComplianceReport(organizationId);
        const gdprReport = await this.gdprManager.generateComplianceReport(organizationId);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const auditReport = await this.auditManager.generateAuditReport(organizationId, startDate, endDate);

        const overallScore = Math.round(
            (soc2Report.overallScore + gdprReport.complianceScore + auditReport.complianceScore) / 3
        );

        // Count findings by severity
        const allFindings = Array.from(this.findings.values());
        const criticalFindings = allFindings.filter(f => f.severity === AuditEventSeverity.CRITICAL).length;
        const highFindings = allFindings.filter(f => f.severity === AuditEventSeverity.HIGH).length;
        const mediumFindings = allFindings.filter(f => f.severity === AuditEventSeverity.MEDIUM).length;
        const lowFindings = allFindings.filter(f => f.severity === AuditEventSeverity.LOW).length;

        // Count certifications
        const allCertifications = Array.from(this.certifications.values());
        const activeCertifications = allCertifications.filter(c => c.status === ComplianceStatus.COMPLIANT).length;

        // Count certifications expiring in the next 90 days
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
        const expiringSoonCertifications = allCertifications.filter(c =>
            c.validUntil && c.validUntil <= ninetyDaysFromNow
        ).length;

        // Calculate next assessment due date
        const nextAssessmentDue = new Date();
        nextAssessmentDue.setDate(nextAssessmentDue.getDate() + this.config.soc2.assessmentInterval);

        return {
            overallScore,
            soc2Score: soc2Report.overallScore,
            gdprScore: gdprReport.complianceScore,
            auditTrailScore: auditReport.complianceScore,
            totalFindings: allFindings.length,
            criticalFindings,
            highFindings,
            mediumFindings,
            lowFindings,
            activeCertifications,
            expiringSoonCertifications,
            lastAssessmentDate: new Date(),
            nextAssessmentDue,
        };
    }

    /**
     * Add a compliance certification
     */
    async addCertification(certification: Omit<ComplianceCertification, 'id'>): Promise<string> {
        const id = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const fullCertification: ComplianceCertification = {
            id,
            ...certification,
        };

        this.certifications.set(id, fullCertification);
        return id;
    }

    /**
     * Update a compliance certification
     */
    async updateCertification(
        certificationId: string,
        updates: Partial<ComplianceCertification>
    ): Promise<boolean> {
        const certification = this.certifications.get(certificationId);
        if (!certification) {
            return false;
        }

        const updatedCertification = { ...certification, ...updates };
        this.certifications.set(certificationId, updatedCertification);
        return true;
    }

    /**
     * Add a compliance finding
     */
    async addFinding(finding: Omit<ComplianceFinding, 'id'>): Promise<string> {
        const id = `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const fullFinding: ComplianceFinding = {
            id,
            ...finding,
        };

        this.findings.set(id, fullFinding);
        return id;
    }

    /**
     * Update a compliance finding
     */
    async updateFinding(findingId: string, updates: Partial<ComplianceFinding>): Promise<boolean> {
        const finding = this.findings.get(findingId);
        if (!finding) {
            return false;
        }

        const updatedFinding = { ...finding, ...updates };

        // Set resolved date if status is being changed to resolved
        if (updates.status === 'resolved' && finding.status !== 'resolved') {
            updatedFinding.resolvedDate = new Date();
        }

        this.findings.set(findingId, updatedFinding);
        return true;
    }

    /**
     * Get all certifications
     */
    getCertifications(): ComplianceCertification[] {
        return Array.from(this.certifications.values());
    }

    /**
     * Get certifications by type
     */
    getCertificationsByType(type: ComplianceCertification['type']): ComplianceCertification[] {
        return Array.from(this.certifications.values()).filter(cert => cert.type === type);
    }

    /**
     * Get all findings
     */
    getFindings(): ComplianceFinding[] {
        return Array.from(this.findings.values());
    }

    /**
     * Get findings by status
     */
    getFindingsByStatus(status: ComplianceFinding['status']): ComplianceFinding[] {
        return Array.from(this.findings.values()).filter(finding => finding.status === status);
    }

    /**
     * Get findings by severity
     */
    getFindingsBySeverity(severity: AuditEventSeverity): ComplianceFinding[] {
        return Array.from(this.findings.values()).filter(finding => finding.severity === severity);
    }

    /**
     * Get overdue findings
     */
    getOverdueFindings(): ComplianceFinding[] {
        const now = new Date();
        return Array.from(this.findings.values()).filter(finding =>
            finding.dueDate &&
            finding.dueDate < now &&
            finding.status !== 'resolved'
        );
    }

    /**
     * Generate compliance trend data
     */
    async getComplianceTrends(
        organizationId: string,
        days: number = 90
    ): Promise<{
        dates: string[];
        overallScores: number[];
        soc2Scores: number[];
        gdprScores: number[];
        auditScores: number[];
    }> {
        const trends = {
            dates: [] as string[],
            overallScores: [] as number[],
            soc2Scores: [] as number[],
            gdprScores: [] as number[],
            auditScores: [] as number[],
        };

        // Generate trend data for the specified number of days
        // In a real implementation, this would query historical data
        for (let i = days; i >= 0; i -= 7) { // Weekly data points
            const date = new Date();
            date.setDate(date.getDate() - i);

            trends.dates.push(date.toISOString().split('T')[0]);

            // Simulate trend data (in real implementation, this would be historical data)
            const baseScore = 75 + Math.random() * 20;
            trends.overallScores.push(Math.round(baseScore));
            trends.soc2Scores.push(Math.round(baseScore + Math.random() * 10 - 5));
            trends.gdprScores.push(Math.round(baseScore + Math.random() * 10 - 5));
            trends.auditScores.push(Math.round(baseScore + Math.random() * 10 - 5));
        }

        return trends;
    }

    /**
     * Schedule compliance assessment
     */
    async scheduleAssessment(
        organizationId: string,
        assessmentType: 'soc2' | 'gdpr' | 'comprehensive',
        scheduledDate: Date,
        assessor?: string
    ): Promise<string> {
        const assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // In a real implementation, this would create a scheduled task
        console.log(`Scheduled ${assessmentType} assessment for ${organizationId} on ${scheduledDate.toISOString()}`);

        return assessmentId;
    }

    /**
     * Export compliance data
     */
    async exportComplianceData(
        organizationId: string,
        format: 'json' | 'csv' | 'pdf' = 'json'
    ): Promise<string> {
        const report = await this.generateComprehensiveReport(organizationId);
        const metrics = await this.getDashboardMetrics(organizationId);
        const certifications = this.getCertifications();
        const findings = this.getFindings();

        const exportData = {
            report,
            metrics,
            certifications,
            findings,
            exportDate: new Date().toISOString(),
        };

        switch (format) {
            case 'json':
                return JSON.stringify(exportData, null, 2);

            case 'csv':
                // Simplified CSV export (in real implementation, this would be more comprehensive)
                return this.convertComplianceDataToCSV(exportData);

            case 'pdf':
                // In real implementation, this would generate a PDF report
                return `PDF export not implemented - use JSON format. Report ID: ${report.id}`;

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Convert compliance data to CSV format
     */
    private convertComplianceDataToCSV(data: any): string {
        const lines = [];

        // Add report summary
        lines.push('Compliance Report Summary');
        lines.push(`Report ID,${data.report.id}`);
        lines.push(`Organization ID,${data.report.organizationId}`);
        lines.push(`Overall Score,${data.report.score}`);
        lines.push(`Status,${data.report.status}`);
        lines.push(`Generated At,${data.report.generatedAt}`);
        lines.push('');

        // Add findings
        lines.push('Findings');
        lines.push('Type,Severity,Description,Recommendation');
        for (const finding of data.report.findings) {
            lines.push(`${finding.type},${finding.severity},"${finding.description}","${finding.recommendation}"`);
        }
        lines.push('');

        // Add certifications
        lines.push('Certifications');
        lines.push('Name,Status,Valid Until,Certificate URL');
        for (const cert of data.report.certifications) {
            lines.push(`"${cert.name}",${cert.status},${cert.validUntil || ''},${cert.certificateUrl || ''}`);
        }

        return lines.join('\n');
    }
}