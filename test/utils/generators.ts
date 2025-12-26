import * as fc from 'fast-check';

/**
 * Property-based testing generators for the DocuSign Alternative platform
 * These generators create random test data for comprehensive property testing
 */

// Basic data generators
export const arbitraryEmail = () =>
    fc.emailAddress();

export const arbitraryUUID = () =>
    fc.uuid();

export const arbitraryPassword = () =>
    fc.string({ minLength: 8, maxLength: 128 })
        .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s));

export const arbitraryName = () =>
    fc.string({ minLength: 1, maxLength: 100 })
        .filter(s => s.trim().length > 0);

export const arbitraryPhoneNumber = () =>
    fc.string({ minLength: 10, maxLength: 15 })
        .map(s => s.replace(/\D/g, ''))
        .filter(s => s.length >= 10);

// User data generators
export const arbitraryUser = () =>
    fc.record({
        id: arbitraryUUID(),
        email: arbitraryEmail(),
        name: arbitraryName(),
        password: arbitraryPassword(),
        createdAt: fc.date(),
        updatedAt: fc.date(),
    });

export const arbitraryUserRegistration = () =>
    fc.record({
        email: arbitraryEmail(),
        name: arbitraryName(),
        password: arbitraryPassword(),
        confirmPassword: fc.string(),
    }).map(data => ({
        ...data,
        confirmPassword: data.password, // Ensure passwords match
    }));

// Organization data generators
export const arbitraryOrganization = () =>
    fc.record({
        id: arbitraryUUID(),
        name: arbitraryName(),
        domain: fc.option(fc.domain()),
        createdAt: fc.date(),
        updatedAt: fc.date(),
    });

// Document data generators
export const arbitraryDocumentMetadata = () =>
    fc.record({
        title: arbitraryName(),
        description: fc.option(fc.string({ maxLength: 500 })),
        tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
        category: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    });

export const arbitraryDocument = () =>
    fc.record({
        id: arbitraryUUID(),
        name: arbitraryName(),
        originalName: arbitraryName(),
        mimeType: fc.constantFrom('application/pdf', 'application/msword', 'text/plain'),
        size: fc.integer({ min: 1, max: 10000000 }), // 1 byte to 10MB
        hash: fc.hexaString({ minLength: 64, maxLength: 64 }),
        metadata: arbitraryDocumentMetadata(),
        createdAt: fc.date(),
        updatedAt: fc.date(),
    });

// Signature data generators
export const arbitrarySignatureType = () =>
    fc.constantFrom('drawn', 'typed', 'uploaded');

export const arbitrarySignature = () =>
    fc.record({
        id: arbitraryUUID(),
        type: arbitrarySignatureType(),
        data: fc.base64String(),
        timestamp: fc.date(),
        ipAddress: fc.ipV4(),
        userAgent: fc.string({ minLength: 10, maxLength: 200 }),
    });

// Field data generators
export const arbitraryFieldType = () =>
    fc.constantFrom('signature', 'text', 'date', 'checkbox', 'radio', 'dropdown');

export const arbitraryFieldPosition = () =>
    fc.record({
        x: fc.float({ min: 0, max: 1 }),
        y: fc.float({ min: 0, max: 1 }),
        width: fc.float({ min: 0.01, max: 0.5 }),
        height: fc.float({ min: 0.01, max: 0.2 }),
        page: fc.integer({ min: 1, max: 100 }),
    });

export const arbitraryDocumentField = () =>
    fc.record({
        id: arbitraryUUID(),
        type: arbitraryFieldType(),
        position: arbitraryFieldPosition(),
        required: fc.boolean(),
        label: fc.option(arbitraryName()),
        placeholder: fc.option(fc.string({ maxLength: 100 })),
    });

// Template data generators
export const arbitraryTemplate = () =>
    fc.record({
        id: arbitraryUUID(),
        name: arbitraryName(),
        description: fc.option(fc.string({ maxLength: 500 })),
        isPublic: fc.boolean(),
        fields: fc.array(arbitraryDocumentField(), { maxLength: 20 }),
        createdAt: fc.date(),
        updatedAt: fc.date(),
    });

// Workflow data generators
export const arbitraryWorkflowStatus = () =>
    fc.constantFrom('draft', 'active', 'completed', 'cancelled', 'expired');

export const arbitrarySigningOrder = () =>
    fc.constantFrom('sequential', 'parallel');

export const arbitraryWorkflow = () =>
    fc.record({
        id: arbitraryUUID(),
        status: arbitraryWorkflowStatus(),
        signingOrder: arbitrarySigningOrder(),
        expiresAt: fc.option(fc.date()),
        createdAt: fc.date(),
        updatedAt: fc.date(),
    });

// Recipient data generators
export const arbitraryRecipientRole = () =>
    fc.constantFrom('signer', 'viewer', 'approver', 'cc');

export const arbitraryRecipient = () =>
    fc.record({
        id: arbitraryUUID(),
        email: arbitraryEmail(),
        name: arbitraryName(),
        role: arbitraryRecipientRole(),
        order: fc.integer({ min: 1, max: 100 }),
        completed: fc.boolean(),
        completedAt: fc.option(fc.date()),
    });

// API data generators
export const arbitraryAPIToken = () =>
    fc.record({
        id: arbitraryUUID(),
        name: arbitraryName(),
        token: fc.base64String({ minLength: 32, maxLength: 64 }),
        permissions: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
        expiresAt: fc.option(fc.date()),
        lastUsedAt: fc.option(fc.date()),
        createdAt: fc.date(),
    });

// Error data generators
export const arbitraryErrorCode = () =>
    fc.constantFrom(
        'VALIDATION_ERROR',
        'AUTHENTICATION_ERROR',
        'AUTHORIZATION_ERROR',
        'NOT_FOUND_ERROR',
        'CONFLICT_ERROR',
        'RATE_LIMIT_ERROR',
        'INTERNAL_ERROR'
    );

export const arbitraryError = () =>
    fc.record({
        code: arbitraryErrorCode(),
        message: fc.string({ minLength: 1, maxLength: 200 }),
        details: fc.option(fc.object()),
        timestamp: fc.date(),
    });

// Audit trail generators
export const arbitraryAuditAction = () =>
    fc.constantFrom(
        'document.created',
        'document.updated',
        'document.deleted',
        'document.signed',
        'user.login',
        'user.logout',
        'template.created',
        'workflow.started'
    );

export const arbitraryAuditEvent = () =>
    fc.record({
        id: arbitraryUUID(),
        action: arbitraryAuditAction(),
        userId: fc.option(arbitraryUUID()),
        entityId: arbitraryUUID(),
        entityType: fc.string({ minLength: 1, maxLength: 50 }),
        metadata: fc.object(),
        ipAddress: fc.ipV4(),
        userAgent: fc.string({ minLength: 10, max: 200 }),
        timestamp: fc.date(),
    });

// Complex scenario generators
export const arbitrarySigningScenario = () =>
    fc.record({
        document: arbitraryDocument(),
        recipients: fc.array(arbitraryRecipient(), { minLength: 1, maxLength: 10 }),
        fields: fc.array(arbitraryDocumentField(), { minLength: 1, maxLength: 20 }),
        workflow: arbitraryWorkflow(),
    });

export const arbitraryMultiPartyWorkflow = () =>
    fc.record({
        documents: fc.array(arbitraryDocument(), { minLength: 1, maxLength: 5 }),
        recipients: fc.array(arbitraryRecipient(), { minLength: 2, maxLength: 20 }),
        signingOrder: arbitrarySigningOrder(),
        conditionalLogic: fc.boolean(),
    });

// Validation helpers
export const validEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

export const validPassword = (password: string): boolean => {
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password);
};