import { z } from 'zod';
import { SOC2Control, SOC2ControlType, SOC2ControlStatus, SOC2ControlSchema } from './types';
import { calculateComplianceScore } from './utils';

/**
 * SOC 2 Compliance Implementation
 * 
 * This module implements SOC 2 Type II compliance controls and monitoring
 * for the Signtusk platform.
 */

// SOC 2 Control Framework
export const SOC2_CONTROLS: Record<string, SOC2Control> = {
    // Security Controls
    'CC6.1': {
        id: 'CC6.1',
        name: 'Logical and Physical Access Controls',
        description: 'The entity implements logical and physical access controls to protect against threats from sources outside its system boundaries.',
        type: SOC2ControlType.SECURITY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },
    'CC6.2': {
        id: 'CC6.2',
        name: 'Access Control Management',
        description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.',
        type: SOC2ControlType.SECURITY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },
    'CC6.3': {
        id: 'CC6.3',
        name: 'Network Security',
        description: 'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets.',
        type: SOC2ControlType.SECURITY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },
    'CC6.7': {
        id: 'CC6.7',
        name: 'Data Transmission',
        description: 'The entity restricts the transmission, movement, and removal of information to authorized internal and external users.',
        type: SOC2ControlType.SECURITY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },
    'CC6.8': {
        id: 'CC6.8',
        name: 'System Access Monitoring',
        description: 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.',
        type: SOC2ControlType.SECURITY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },

    // Availability Controls
    'A1.1': {
        id: 'A1.1',
        name: 'System Availability',
        description: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components.',
        type: SOC2ControlType.AVAILABILITY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },
    'A1.2': {
        id: 'A1.2',
        name: 'System Monitoring',
        description: 'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections.',
        type: SOC2ControlType.AVAILABILITY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },

    // Processing Integrity Controls
    'PI1.1': {
        id: 'PI1.1',
        name: 'Data Processing Integrity',
        description: 'The entity implements controls over inputs, processing, and outputs to meet the entity\'s service commitments and system requirements.',
        type: SOC2ControlType.PROCESSING_INTEGRITY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },

    // Confidentiality Controls
    'C1.1': {
        id: 'C1.1',
        name: 'Confidential Information Protection',
        description: 'The entity identifies and maintains confidential information to meet the entity\'s service commitments and system requirements.',
        type: SOC2ControlType.CONFIDENTIALITY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },
    'C1.2': {
        id: 'C1.2',
        name: 'Confidential Information Disposal',
        description: 'The entity disposes of confidential information to meet the entity\'s service commitments and system requirements.',
        type: SOC2ControlType.CONFIDENTIALITY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },

    // Privacy Controls
    'P1.1': {
        id: 'P1.1',
        name: 'Privacy Notice',
        description: 'The entity provides notice to data subjects about its privacy practices.',
        type: SOC2ControlType.PRIVACY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },
    'P2.1': {
        id: 'P2.1',
        name: 'Consent Management',
        description: 'The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information.',
        type: SOC2ControlType.PRIVACY,
        status: SOC2ControlStatus.NOT_IMPLEMENTED,
    },
};

export interface SOC2AssessmentResult {
    controlId: string;
    status: SOC2ControlStatus;
    evidence: string[];
    assessedBy: string;
    assessedAt: Date;
    notes?: string;
}

export interface SOC2ComplianceReport {
    organizationId: string;
    assessmentDate: Date;
    overallScore: number;
    controlResults: SOC2AssessmentResult[];
    recommendations: string[];
    nextAssessmentDue: Date;
}

/**
 * SOC 2 Compliance Manager
 */
export class SOC2ComplianceManager {
    private controls: Map<string, SOC2Control>;

    constructor() {
        this.controls = new Map(Object.entries(SOC2_CONTROLS));
    }

    /**
     * Assess a specific SOC 2 control
     */
    async assessControl(
        controlId: string,
        status: SOC2ControlStatus,
        evidence: string[] = [],
        assessedBy: string,
        notes?: string
    ): Promise<SOC2AssessmentResult> {
        const control = this.controls.get(controlId);
        if (!control) {
            throw new Error(`SOC 2 control ${controlId} not found`);
        }

        // Update control status
        control.status = status;
        control.evidence = evidence;
        control.lastAssessed = new Date();
        control.assessedBy = assessedBy;
        control.notes = notes;

        this.controls.set(controlId, control);

        return {
            controlId,
            status,
            evidence,
            assessedBy,
            assessedAt: new Date(),
            notes,
        };
    }

    /**
     * Generate a comprehensive SOC 2 compliance report
     */
    async generateComplianceReport(organizationId: string): Promise<SOC2ComplianceReport> {
        const controlResults: SOC2AssessmentResult[] = [];
        let implementedCount = 0;
        let partiallyImplementedCount = 0;
        const totalCount = this.controls.size;

        for (const [controlId, control] of this.controls) {
            controlResults.push({
                controlId,
                status: control.status,
                evidence: control.evidence || [],
                assessedBy: control.assessedBy || 'System',
                assessedAt: control.lastAssessed || new Date(),
                notes: control.notes,
            });

            if (control.status === SOC2ControlStatus.IMPLEMENTED) {
                implementedCount++;
            } else if (control.status === SOC2ControlStatus.PARTIALLY_IMPLEMENTED) {
                partiallyImplementedCount++;
            }
        }

        const overallScore = calculateComplianceScore(totalCount, implementedCount, partiallyImplementedCount);

        // Generate recommendations based on non-implemented controls
        const recommendations = this.generateRecommendations();

        // Next assessment due in 90 days
        const nextAssessmentDue = new Date();
        nextAssessmentDue.setDate(nextAssessmentDue.getDate() + 90);

        return {
            organizationId,
            assessmentDate: new Date(),
            overallScore,
            controlResults,
            recommendations,
            nextAssessmentDue,
        };
    }

    /**
     * Get controls by type
     */
    getControlsByType(type: SOC2ControlType): SOC2Control[] {
        return Array.from(this.controls.values()).filter(control => control.type === type);
    }

    /**
     * Get controls by status
     */
    getControlsByStatus(status: SOC2ControlStatus): SOC2Control[] {
        return Array.from(this.controls.values()).filter(control => control.status === status);
    }

    /**
     * Check if organization meets SOC 2 compliance threshold
     */
    isCompliant(minimumScore: number = 80): boolean {
        const implementedCount = this.getControlsByStatus(SOC2ControlStatus.IMPLEMENTED).length;
        const partiallyImplementedCount = this.getControlsByStatus(SOC2ControlStatus.PARTIALLY_IMPLEMENTED).length;
        const totalCount = this.controls.size;

        const score = calculateComplianceScore(totalCount, implementedCount, partiallyImplementedCount);
        return score >= minimumScore;
    }

    /**
     * Generate recommendations for improving SOC 2 compliance
     */
    private generateRecommendations(): string[] {
        const recommendations: string[] = [];
        const nonImplementedControls = this.getControlsByStatus(SOC2ControlStatus.NOT_IMPLEMENTED);
        const partiallyImplementedControls = this.getControlsByStatus(SOC2ControlStatus.PARTIALLY_IMPLEMENTED);

        if (nonImplementedControls.length > 0) {
            recommendations.push(
                `Implement ${nonImplementedControls.length} missing controls to improve compliance score`
            );
        }

        if (partiallyImplementedControls.length > 0) {
            recommendations.push(
                `Complete implementation of ${partiallyImplementedControls.length} partially implemented controls`
            );
        }

        // Specific recommendations by control type
        const securityControls = nonImplementedControls.filter(c => c.type === SOC2ControlType.SECURITY);
        if (securityControls.length > 0) {
            recommendations.push('Priority: Implement security controls for access management and network protection');
        }

        const availabilityControls = nonImplementedControls.filter(c => c.type === SOC2ControlType.AVAILABILITY);
        if (availabilityControls.length > 0) {
            recommendations.push('Implement system monitoring and capacity management controls');
        }

        const privacyControls = nonImplementedControls.filter(c => c.type === SOC2ControlType.PRIVACY);
        if (privacyControls.length > 0) {
            recommendations.push('Establish privacy notice and consent management processes');
        }

        return recommendations;
    }

    /**
     * Validate SOC 2 control implementation
     */
    validateControlImplementation(controlId: string): boolean {
        const control = this.controls.get(controlId);
        if (!control) {
            return false;
        }

        return control.status === SOC2ControlStatus.IMPLEMENTED &&
            control.evidence !== undefined &&
            control.evidence.length > 0 &&
            control.lastAssessed !== undefined;
    }

    /**
     * Get all controls
     */
    getAllControls(): SOC2Control[] {
        return Array.from(this.controls.values());
    }
}