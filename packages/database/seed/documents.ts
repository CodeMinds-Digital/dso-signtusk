import { PrismaClient, Organisation, User } from '@prisma/client';

export async function seedDocuments(prisma: PrismaClient, organizations: Organisation[], users: User[]): Promise<void> {
    // Create folders first
    const folders = [
        {
            id: 'folder_contracts_001',
            name: 'Contracts',
            organizationId: organizations[0].id,
            createdBy: users[0].id,
        },
        {
            id: 'folder_hr_docs_002',
            name: 'HR Documents',
            organizationId: organizations[0].id,
            createdBy: users[0].id,
        },
        {
            id: 'folder_legal_003',
            name: 'Legal Documents',
            organizationId: organizations[2].id,
            createdBy: users[5].id,
        },
    ];

    for (const folderData of folders) {
        await prisma.folder.create({
            data: folderData,
        });
    }

    // Create sample documents
    const documents = [
        {
            id: 'doc_employment_contract_001',
            name: 'Employment Contract - John Doe',
            originalName: 'employment_contract_john_doe.pdf',
            mimeType: 'application/pdf',
            size: 245760, // ~240KB
            hash: 'sha256_employment_contract_001',
            status: 'READY' as const,
            folderId: 'folder_hr_docs_002',
            organizationId: organizations[0].id,
            createdBy: users[0].id,
            ownedBy: users[0].id,
            metadata: {
                department: 'Human Resources',
                documentType: 'Employment Contract',
                confidential: true,
            },
        },
        {
            id: 'doc_nda_template_002',
            name: 'Non-Disclosure Agreement Template',
            originalName: 'nda_template.pdf',
            mimeType: 'application/pdf',
            size: 189440, // ~185KB
            hash: 'sha256_nda_template_002',
            status: 'READY' as const,
            folderId: 'folder_contracts_001',
            organizationId: organizations[0].id,
            createdBy: users[1].id,
            ownedBy: users[1].id,
            isTemplate: true,
            metadata: {
                documentType: 'NDA',
                version: '2.1',
                lastReviewed: '2024-01-15',
            },
        },
        {
            id: 'doc_service_agreement_003',
            name: 'Service Agreement - TechStart Project',
            originalName: 'service_agreement_techstart.pdf',
            mimeType: 'application/pdf',
            size: 312320, // ~305KB
            hash: 'sha256_service_agreement_003',
            status: 'SENT' as const,
            folderId: 'folder_contracts_001',
            organizationId: organizations[1].id,
            createdBy: users[3].id,
            ownedBy: users[3].id,
            metadata: {
                projectName: 'TechStart Digital Transformation',
                value: 150000,
                currency: 'USD',
            },
        },
        {
            id: 'doc_legal_opinion_004',
            name: 'Legal Opinion - Compliance Review',
            originalName: 'legal_opinion_compliance.pdf',
            mimeType: 'application/pdf',
            size: 567890, // ~555KB
            hash: 'sha256_legal_opinion_004',
            status: 'COMPLETED' as const,
            folderId: 'folder_legal_003',
            organizationId: organizations[2].id,
            createdBy: users[5].id,
            ownedBy: users[5].id,
            metadata: {
                caseNumber: 'LP-2024-001',
                practiceArea: 'Corporate Compliance',
                billableHours: 12.5,
            },
        },
    ];

    for (const docData of documents) {
        const document = await prisma.document.create({
            data: docData,
        });

        // Create document version
        await prisma.documentVersion.create({
            data: {
                documentId: document.id,
                versionNumber: 1,
                fileUrl: `https://storage.example.com/documents/${document.id}/v1.pdf`,
                thumbnailUrl: `https://storage.example.com/thumbnails/${document.id}/v1.jpg`,
                size: document.size,
                hash: document.hash,
                createdBy: document.createdBy,
                changes: {
                    type: 'initial_upload',
                    description: 'Initial document upload',
                },
            },
        });

        // Create sample document fields for contracts
        if (document.name.includes('Contract') || document.name.includes('Agreement')) {
            const fields = [
                {
                    documentId: document.id,
                    type: 'SIGNATURE' as const,
                    name: 'Client Signature',
                    page: 1,
                    x: 100.0,
                    y: 650.0,
                    width: 200.0,
                    height: 50.0,
                    isRequired: true,
                    properties: {
                        signatureType: 'full_name',
                        fontSize: 12,
                    },
                },
                {
                    documentId: document.id,
                    type: 'DATE' as const,
                    name: 'Signature Date',
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
                    documentId: document.id,
                    type: 'TEXT' as const,
                    name: 'Client Name',
                    page: 1,
                    x: 100.0,
                    y: 600.0,
                    width: 200.0,
                    height: 30.0,
                    isRequired: true,
                    properties: {
                        placeholder: 'Enter full name',
                        maxLength: 100,
                    },
                },
            ];

            for (const fieldData of fields) {
                await prisma.documentField.create({
                    data: fieldData,
                });
            }
        }
    }
}