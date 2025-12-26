import { describe, it, expect } from 'vitest';
import { ImmutableAuditTrailManager } from './audit-trail';
import { AuditEventType, AuditEventSeverity } from './types';

describe('Debug Audit Trail', () => {
    it('should create and verify a simple audit record', async () => {
        const auditManager = new ImmutableAuditTrailManager();

        const recordId = await auditManager.createAuditRecord(
            AuditEventType.DOCUMENT_CREATED,
            'org-123',
            'document',
            'doc-456',
            'document_created',
            { name: 'Test Document' },
            {
                userId: 'user-789',
                severity: AuditEventSeverity.LOW,
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0 Test',
            }
        );

        console.log('Created record ID:', recordId);

        const record = auditManager.getAuditRecord(recordId);
        console.log('Retrieved record:', record);

        const integrityValid = await auditManager.verifyRecordIntegrity(recordId);
        console.log('Integrity valid:', integrityValid);

        expect(integrityValid).toBe(true);
    });
});