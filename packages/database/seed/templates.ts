import { PrismaClient, Organization, User } from '@prisma/client';

export async function seedTemplates(prisma: PrismaClient, organizations: Organization[], users: User[]): Promise<void> {
    // Find template documents
    const ndaDocument = await prisma.document.findFirst({
        where: { name: 'Non-Disclosure Agreement Template' },
    });

    if (!ndaDocument) return;

    const templates = [
        {
            id: 'template_nda_standard_001',
            name: 'Standard NDA Template',
            description: 'Standard non-disclosure agreement for business partnerships and vendor relationships',
            documentId: ndaDocument.id,
            organizationId: organizations[0].id,
            createdBy: users[1].id,
            isPublic: true,
            category: 'Legal',
            tags: ['NDA', 'Confidentiality', 'Business'],
            settings: {
                allowRecipientReorder: false,
                requireAllSignatures: true,
                expirationDays: 30,
                reminderFrequency: 'weekly',
            },
            workflow: {
                type: 'sequential',
                steps: [
                    {
                        order: 1,
                        role: 'disclosing_party',
                        action: 'sign',
                        required: true,
                    },
                    {
                        order: 2,
                        role: 'receiving_party',
                        action: 'sign',
                        required: true,
                    },
                ],
            },
        },
        {
            id: 'template_employment_002',
            name: 'Employee Onboarding Package',
            description: 'Complete employment documentation package for new hires',
            documentId: ndaDocument.id, // Using NDA doc as placeholder
            organizationId: organizations[0].id,
            createdBy: users[0].id,
            isPublic: false,
            category: 'HR',
            tags: ['Employment', 'Onboarding', 'HR'],
            settings: {
                allowRecipientReorder: false,
                requireAllSignatures: true,
                expirationDays: 14,
                reminderFrequency: 'daily',
                requireIdVerification: true,
            },
            workflow: {
                type: 'parallel',
                steps: [
                    {
                        order: 1,
                        role: 'employee',
                        action: 'sign',
                        required: true,
                    },
                    {
                        order: 1,
                        role: 'hr_manager',
                        action: 'approve',
                        required: true,
                    },
                ],
            },
        },
        {
            id: 'template_service_contract_003',
            name: 'Professional Services Contract',
            description: 'Standard contract template for professional services engagements',
            documentId: ndaDocument.id, // Using NDA doc as placeholder
            organizationId: organizations[1].id,
            createdBy: users[3].id,
            isPublic: false,
            category: 'Contracts',
            tags: ['Services', 'Contract', 'Professional'],
            settings: {
                allowRecipientReorder: true,
                requireAllSignatures: true,
                expirationDays: 45,
                reminderFrequency: 'weekly',
            },
            workflow: {
                type: 'conditional',
                steps: [
                    {
                        order: 1,
                        role: 'client',
                        action: 'review',
                        required: true,
                    },
                    {
                        order: 2,
                        role: 'legal_counsel',
                        action: 'approve',
                        required: true,
                        condition: 'contract_value > 50000',
                    },
                    {
                        order: 3,
                        role: 'service_provider',
                        action: 'sign',
                        required: true,
                    },
                    {
                        order: 4,
                        role: 'client',
                        action: 'sign',
                        required: true,
                    },
                ],
            },
        },
    ];

    for (const templateData of templates) {
        const template = await prisma.template.create({
            data: templateData,
        });

        // Create template fields
        const templateFields = [
            {
                templateId: template.id,
                type: 'SIGNATURE' as const,
                name: 'Primary Signature',
                page: 1,
                x: 100.0,
                y: 650.0,
                width: 200.0,
                height: 50.0,
                isRequired: true,
                recipientRole: template.name.includes('NDA') ? 'disclosing_party' : 'client',
                properties: {
                    signatureType: 'full_name',
                    fontSize: 12,
                },
            },
            {
                templateId: template.id,
                type: 'SIGNATURE' as const,
                name: 'Secondary Signature',
                page: 1,
                x: 100.0,
                y: 550.0,
                width: 200.0,
                height: 50.0,
                isRequired: true,
                recipientRole: template.name.includes('NDA') ? 'receiving_party' : 'service_provider',
                properties: {
                    signatureType: 'full_name',
                    fontSize: 12,
                },
            },
            {
                templateId: template.id,
                type: 'DATE' as const,
                name: 'Agreement Date',
                page: 1,
                x: 320.0,
                y: 650.0,
                width: 100.0,
                height: 30.0,
                isRequired: true,
                properties: {
                    format: 'MM/DD/YYYY',
                    autoFill: true,
                },
            },
            {
                templateId: template.id,
                type: 'TEXT' as const,
                name: 'Company Name',
                page: 1,
                x: 100.0,
                y: 500.0,
                width: 200.0,
                height: 30.0,
                isRequired: true,
                properties: {
                    placeholder: 'Enter company name',
                    maxLength: 100,
                },
            },
        ];

        for (const fieldData of templateFields) {
            await prisma.templateField.create({
                data: fieldData,
            });
        }

        // Create template recipients
        const templateRecipients = [
            {
                templateId: template.id,
                role: template.name.includes('NDA') ? 'disclosing_party' : 'client',
                name: 'Primary Signer',
                order: 1,
                authMethod: 'EMAIL' as const,
                isRequired: true,
            },
            {
                templateId: template.id,
                role: template.name.includes('NDA') ? 'receiving_party' : 'service_provider',
                name: 'Secondary Signer',
                order: 2,
                authMethod: 'EMAIL' as const,
                isRequired: true,
            },
        ];

        // Add legal counsel for service contracts
        if (template.name.includes('Services')) {
            templateRecipients.push({
                templateId: template.id,
                role: 'legal_counsel',
                name: 'Legal Reviewer',
                order: 2,
                authMethod: 'EMAIL' as const,
                isRequired: false,
            });
        }

        for (const recipientData of templateRecipients) {
            await prisma.templateRecipient.create({
                data: recipientData,
            });
        }

        // Create template analytics
        await prisma.templateAnalytics.create({
            data: {
                templateId: template.id,
                eventType: 'template_created',
                metadata: {
                    category: template.category,
                    isPublic: template.isPublic,
                    fieldCount: templateFields.length,
                    recipientCount: templateRecipients.length,
                },
                userId: template.createdBy,
            },
        });
    }
}