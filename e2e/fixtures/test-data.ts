/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
    admin: {
        email: 'admin@test.com',
        password: 'AdminTest123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
    },
    user: {
        email: 'user@test.com',
        password: 'UserTest123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
    },
    signer: {
        email: 'signer@test.com',
        password: 'SignerTest123!',
        firstName: 'Signer',
        lastName: 'User',
        role: 'signer',
    },
} as const;

export const testOrganizations = {
    acmeCorp: {
        name: 'Acme Corporation',
        domain: 'acme.com',
        settings: {
            requireTwoFactor: false,
            allowPublicSigning: true,
            documentRetentionDays: 365,
        },
    },
    techStartup: {
        name: 'Tech Startup Inc',
        domain: 'techstartup.com',
        settings: {
            requireTwoFactor: true,
            allowPublicSigning: false,
            documentRetentionDays: 2555, // 7 years
        },
    },
} as const;

export const testDocuments = {
    simpleContract: {
        name: 'Simple Contract.pdf',
        path: './e2e/fixtures/documents/simple-contract.pdf',
        fields: [
            {
                type: 'signature',
                page: 1,
                x: 100,
                y: 200,
                width: 200,
                height: 50,
                required: true,
            },
            {
                type: 'date',
                page: 1,
                x: 100,
                y: 300,
                width: 150,
                height: 30,
                required: true,
            },
        ],
    },
    multiPageAgreement: {
        name: 'Multi-Page Agreement.pdf',
        path: './e2e/fixtures/documents/multi-page-agreement.pdf',
        fields: [
            {
                type: 'signature',
                page: 1,
                x: 100,
                y: 500,
                width: 200,
                height: 50,
                required: true,
            },
            {
                type: 'signature',
                page: 3,
                x: 100,
                y: 200,
                width: 200,
                height: 50,
                required: true,
            },
            {
                type: 'text',
                page: 2,
                x: 100,
                y: 100,
                width: 300,
                height: 30,
                required: false,
                placeholder: 'Optional notes',
            },
        ],
    },
} as const;

export const testTemplates = {
    employmentContract: {
        name: 'Employment Contract Template',
        description: 'Standard employment contract with signature fields',
        category: 'HR',
        fields: [
            {
                type: 'text',
                name: 'employee_name',
                label: 'Employee Name',
                required: true,
                page: 1,
                x: 200,
                y: 100,
            },
            {
                type: 'text',
                name: 'start_date',
                label: 'Start Date',
                required: true,
                page: 1,
                x: 200,
                y: 150,
            },
            {
                type: 'signature',
                name: 'employee_signature',
                label: 'Employee Signature',
                required: true,
                page: 2,
                x: 100,
                y: 400,
            },
            {
                type: 'signature',
                name: 'employer_signature',
                label: 'Employer Signature',
                required: true,
                page: 2,
                x: 400,
                y: 400,
            },
        ],
    },
} as const;

export const testEmails = {
    signingRequest: {
        subject: 'Please sign: {{document_name}}',
        message: 'Hello {{recipient_name}}, please review and sign the attached document.',
    },
    completionNotification: {
        subject: 'Document signed: {{document_name}}',
        message: 'The document "{{document_name}}" has been successfully signed by all parties.',
    },
} as const;