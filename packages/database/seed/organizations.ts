import { PrismaClient, Organisation } from '@prisma/client';

export async function seedOrganizations(prisma: PrismaClient): Promise<Organisation[]> {
    const organizations = [
        {
            id: 'org_acme_corp_001',
            name: 'Acme Corporation',
            domain: 'acme.com',
            slug: 'acme-corp',
            settings: {
                allowPublicTemplates: true,
                requireTwoFactor: false,
                documentRetentionDays: 2555, // 7 years
                maxFileSize: 50 * 1024 * 1024, // 50MB
            },
            branding: {
                primaryColor: '#007bff',
                logo: 'https://example.com/acme-logo.png',
                companyName: 'Acme Corporation',
            },
        },
        {
            id: 'org_tech_startup_002',
            name: 'TechStart Inc',
            domain: 'techstart.io',
            slug: 'techstart',
            settings: {
                allowPublicTemplates: false,
                requireTwoFactor: true,
                documentRetentionDays: 1825, // 5 years
                maxFileSize: 25 * 1024 * 1024, // 25MB
            },
            branding: {
                primaryColor: '#28a745',
                logo: 'https://example.com/techstart-logo.png',
                companyName: 'TechStart Inc',
            },
        },
        {
            id: 'org_legal_firm_003',
            name: 'Legal Partners LLC',
            domain: 'legalpartners.com',
            slug: 'legal-partners',
            settings: {
                allowPublicTemplates: false,
                requireTwoFactor: true,
                documentRetentionDays: 3650, // 10 years
                maxFileSize: 100 * 1024 * 1024, // 100MB
                requireDigitalSignatures: true,
            },
            branding: {
                primaryColor: '#6c757d',
                logo: 'https://example.com/legal-logo.png',
                companyName: 'Legal Partners LLC',
            },
        },
    ];

    const createdOrganizations: Organisation[] = [];

    for (const orgData of organizations) {
        const organization = await prisma.organisation.create({
            data: orgData,
        });
        createdOrganizations.push(organization);
    }

    return createdOrganizations;
}