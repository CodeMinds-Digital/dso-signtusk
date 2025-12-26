import type { RecipientSuggestion } from './types';
import { RecipientSuggestionSchema } from './types';

/**
 * Recipient Suggestion Service using usage patterns and document analysis
 */
export class RecipientSuggestionService {
    constructor(private db: any) { }

    /**
     * Suggest recipients based on usage patterns and document content
     */
    async suggestRecipients(documentId: string, organizationId: string): Promise<RecipientSuggestion> {
        const startTime = Date.now();

        try {
            // Get document information
            const document = await this.getDocument(documentId, organizationId);
            if (!document) {
                throw new Error('Document not found');
            }

            // Analyze document content for recipient clues
            const contentSuggestions = await this.analyzeDocumentContent(document);

            // Get historical usage patterns
            const historicalSuggestions = await this.getHistoricalPatterns(organizationId, document);

            // Get organization directory suggestions
            const directorySuggestions = await this.getOrganizationDirectorySuggestions(organizationId, document);

            // Analyze email patterns
            const emailPatternSuggestions = await this.analyzeEmailPatterns(organizationId, document);

            // Combine and rank suggestions
            const allSuggestions = [
                ...contentSuggestions,
                ...historicalSuggestions,
                ...directorySuggestions,
                ...emailPatternSuggestions,
            ];

            // Remove duplicates and rank by confidence
            const uniqueSuggestions = this.deduplicateAndRank(allSuggestions);

            const processingTime = Date.now() - startTime;

            const result: RecipientSuggestion = {
                documentId,
                suggestions: uniqueSuggestions.slice(0, 10), // Top 10 suggestions
                processingTime,
                metadata: {
                    algorithm: 'multi_source_recipient_suggestion_v1',
                    version: '1.0.0',
                    analysisDepth: 'comprehensive',
                },
            };

            // Validate result
            const validatedResult = RecipientSuggestionSchema.parse(result);

            // Store result in database
            await this.storeRecipientSuggestion(validatedResult, organizationId);

            return validatedResult;

        } catch (error) {
            console.error('Recipient suggestion failed:', error);
            throw error;
        }
    }

    /**
     * Analyze document content for recipient clues
     */
    private async analyzeDocumentContent(document: any): Promise<Array<{
        email: string;
        name?: string;
        role: 'signer' | 'approver' | 'reviewer' | 'cc';
        confidence: number;
        reasoning: string;
        source: 'document_content';
        metadata?: any;
    }>> {
        const suggestions: any[] = [];

        // Extract text content (mock implementation)
        const textContent = await this.extractTextContent(document);

        // Look for email addresses in document
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = textContent.match(emailRegex) || [];

        for (const email of emails) {
            // Determine role based on context
            const role = this.determineRoleFromContext(email, textContent);

            suggestions.push({
                email,
                name: this.extractNameFromContext(email, textContent),
                role,
                confidence: 0.8,
                reasoning: 'Email address found in document content',
                source: 'document_content' as const,
            });
        }

        // Look for names that might correspond to known users
        const names = this.extractNamesFromText(textContent);
        for (const name of names) {
            const potentialEmail = await this.findEmailForName(name, document.organizationId);
            if (potentialEmail) {
                const role = this.determineRoleFromContext(name, textContent);

                suggestions.push({
                    email: potentialEmail,
                    name,
                    role,
                    confidence: 0.6,
                    reasoning: `Name "${name}" found in document, matched to known user`,
                    source: 'document_content' as const,
                });
            }
        }

        // Look for role-based indicators
        const roleIndicators = this.findRoleIndicators(textContent);
        for (const indicator of roleIndicators) {
            const potentialRecipients = await this.findRecipientsForRole(
                indicator.role,
                document.organizationId
            );

            for (const recipient of potentialRecipients.slice(0, 2)) { // Top 2 for each role
                suggestions.push({
                    email: recipient.email,
                    name: recipient.name,
                    role: indicator.role,
                    confidence: 0.5,
                    reasoning: `Document mentions "${indicator.text}", suggesting need for ${indicator.role}`,
                    source: 'document_content' as const,
                });
            }
        }

        return suggestions;
    }

    /**
     * Get suggestions based on historical usage patterns
     */
    private async getHistoricalPatterns(organizationId: string, document: any): Promise<Array<{
        email: string;
        name?: string;
        role: 'signer' | 'approver' | 'reviewer' | 'cc';
        confidence: number;
        reasoning: string;
        source: 'historical_data';
        metadata?: any;
    }>> {
        const suggestions: any[] = [];

        // Get similar documents by name pattern
        const similarDocuments = await this.findSimilarDocuments(document, organizationId);

        // Analyze recipient patterns from similar documents
        for (const similarDoc of similarDocuments) {
            const recipients = await this.getDocumentRecipients(similarDoc.id);

            for (const recipient of recipients) {
                const frequency = await this.getRecipientFrequency(recipient.email, organizationId);
                const lastUsed = await this.getLastUsedDate(recipient.email, organizationId);

                suggestions.push({
                    email: recipient.email,
                    name: recipient.name,
                    role: recipient.role,
                    confidence: Math.min(0.9, 0.3 + (frequency / 10)), // Higher frequency = higher confidence
                    reasoning: `Used in ${frequency} similar documents, last used ${this.formatDate(lastUsed)}`,
                    source: 'historical_data' as const,
                    metadata: {
                        frequency,
                        lastUsed,
                        similarDocumentId: similarDoc.id,
                    },
                });
            }
        }

        // Get frequently used recipients by document creator
        const creatorRecipients = await this.getCreatorFrequentRecipients(
            document.createdBy,
            organizationId
        );

        for (const recipient of creatorRecipients) {
            suggestions.push({
                email: recipient.email,
                name: recipient.name,
                role: recipient.mostCommonRole,
                confidence: 0.7,
                reasoning: `Frequently used by document creator (${recipient.frequency} times)`,
                source: 'historical_data' as const,
                metadata: {
                    frequency: recipient.frequency,
                    lastUsed: recipient.lastUsed,
                    relationship: 'frequent_collaborator',
                },
            });
        }

        return suggestions;
    }

    /**
     * Get suggestions from organization directory
     */
    private async getOrganizationDirectorySuggestions(
        organizationId: string,
        document: any
    ): Promise<Array<{
        email: string;
        name?: string;
        role: 'signer' | 'approver' | 'reviewer' | 'cc';
        confidence: number;
        reasoning: string;
        source: 'organization_directory';
        metadata?: any;
    }>> {
        const suggestions: any[] = [];

        // Get team members
        const teamMembers = await this.getTeamMembers(organizationId);

        for (const member of teamMembers) {
            // Determine likely role based on member's position/role
            const role = this.mapMemberRoleToSigningRole(member.role);

            suggestions.push({
                email: member.email,
                name: member.name,
                role,
                confidence: 0.4,
                reasoning: `Team member with role: ${member.role}`,
                source: 'organization_directory' as const,
                metadata: {
                    memberRole: member.role,
                    department: member.department,
                },
            });
        }

        // Get managers/approvers
        const managers = await this.getOrganizationManagers(organizationId);

        for (const manager of managers) {
            suggestions.push({
                email: manager.email,
                name: manager.name,
                role: 'approver',
                confidence: 0.6,
                reasoning: `Organization manager in ${manager.department} department`,
                source: 'organization_directory' as const,
                metadata: {
                    managerLevel: manager.level,
                    department: manager.department,
                },
            });
        }

        return suggestions;
    }

    /**
     * Analyze email patterns for suggestions
     */
    private async analyzeEmailPatterns(
        organizationId: string,
        document: any
    ): Promise<Array<{
        email: string;
        name?: string;
        role: 'signer' | 'approver' | 'reviewer' | 'cc';
        confidence: number;
        reasoning: string;
        source: 'email_patterns';
        metadata?: any;
    }>> {
        const suggestions: any[] = [];

        // Analyze domain patterns
        const domainPatterns = await this.analyzeDomainPatterns(organizationId);

        // Look for common external domains
        for (const pattern of domainPatterns.external) {
            if (pattern.frequency > 5) { // Frequently used external domain
                suggestions.push({
                    email: `contact@${pattern.domain}`,
                    role: 'signer' as const,
                    confidence: 0.3,
                    reasoning: `Frequently used external domain (${pattern.frequency} times)`,
                    source: 'email_patterns' as const,
                    metadata: {
                        domainFrequency: pattern.frequency,
                        domainType: 'external',
                    },
                });
            }
        }

        // Analyze recipient timing patterns
        const timingPatterns = await this.analyzeTimingPatterns(organizationId);

        // Suggest recipients based on time of day/week patterns
        const currentHour = new Date().getHours();
        const currentDay = new Date().getDay();

        for (const pattern of timingPatterns) {
            if (this.isWithinTimePattern(currentHour, currentDay, pattern)) {
                suggestions.push({
                    email: pattern.email,
                    name: pattern.name,
                    role: pattern.mostCommonRole,
                    confidence: 0.5,
                    reasoning: `Often receives documents at this time (${pattern.frequency} times)`,
                    source: 'email_patterns' as const,
                    metadata: {
                        timingPattern: pattern.pattern,
                        frequency: pattern.frequency,
                    },
                });
            }
        }

        return suggestions;
    }

    /**
     * Remove duplicates and rank suggestions by confidence
     */
    private deduplicateAndRank(suggestions: any[]): any[] {
        const emailMap = new Map<string, any>();

        // Combine suggestions for the same email
        for (const suggestion of suggestions) {
            const key = suggestion.email.toLowerCase();

            if (emailMap.has(key)) {
                const existing = emailMap.get(key)!;

                // Use higher confidence
                if (suggestion.confidence > existing.confidence) {
                    existing.confidence = suggestion.confidence;
                    existing.reasoning = suggestion.reasoning;
                    existing.source = suggestion.source;
                }

                // Combine metadata
                if (suggestion.metadata) {
                    existing.metadata = { ...existing.metadata, ...suggestion.metadata };
                }
            } else {
                emailMap.set(key, { ...suggestion });
            }
        }

        // Convert to array and sort by confidence
        return Array.from(emailMap.values())
            .sort((a, b) => b.confidence - a.confidence);
    }

    // Helper methods

    private async extractTextContent(document: any): Promise<string> {
        // Mock implementation - would extract actual text from document
        return `Sample document content for ${document.name}. Contact john.doe@example.com for approval. Manager signature required.`;
    }

    private determineRoleFromContext(identifier: string, text: string): 'signer' | 'approver' | 'reviewer' | 'cc' {
        const context = text.toLowerCase();

        if (context.includes('approv') && context.includes(identifier.toLowerCase())) {
            return 'approver';
        } else if (context.includes('review') && context.includes(identifier.toLowerCase())) {
            return 'reviewer';
        } else if (context.includes('cc') && context.includes(identifier.toLowerCase())) {
            return 'cc';
        } else {
            return 'signer';
        }
    }

    private extractNameFromContext(email: string, text: string): string | undefined {
        // Simple name extraction - would be more sophisticated in real implementation
        const emailPart = email.split('@')[0];
        const nameParts = emailPart.split(/[._-]/);

        if (nameParts.length >= 2) {
            return nameParts.map(part =>
                part.charAt(0).toUpperCase() + part.slice(1)
            ).join(' ');
        }

        return undefined;
    }

    private extractNamesFromText(text: string): string[] {
        // Simple name extraction using regex
        const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
        return text.match(nameRegex) || [];
    }

    private async findEmailForName(name: string, organizationId: string): Promise<string | null> {
        const user = await this.db.user.findFirst({
            where: {
                organizationId,
                name: {
                    contains: name,
                    mode: 'insensitive',
                },
            },
        });

        return user?.email || null;
    }

    private findRoleIndicators(text: string): Array<{
        role: 'signer' | 'approver' | 'reviewer' | 'cc';
        text: string;
    }> {
        const indicators: any[] = [];
        const lowerText = text.toLowerCase();

        const patterns = {
            approver: ['approval required', 'manager approval', 'supervisor sign', 'director approval'],
            reviewer: ['review required', 'legal review', 'compliance review', 'technical review'],
            signer: ['signature required', 'sign here', 'signatory', 'execute agreement'],
            cc: ['for your information', 'fyi', 'copy to', 'notify'],
        };

        Object.entries(patterns).forEach(([role, phrases]) => {
            phrases.forEach(phrase => {
                if (lowerText.includes(phrase)) {
                    indicators.push({
                        role: role as any,
                        text: phrase,
                    });
                }
            });
        });

        return indicators;
    }

    private async findRecipientsForRole(
        role: string,
        organizationId: string
    ): Promise<Array<{ email: string; name: string }>> {
        // Mock implementation - would query actual user database
        const mockRecipients = [
            { email: 'manager@example.com', name: 'Manager Smith' },
            { email: 'legal@example.com', name: 'Legal Team' },
            { email: 'compliance@example.com', name: 'Compliance Officer' },
        ];

        return mockRecipients.slice(0, 2);
    }

    private async findSimilarDocuments(document: any, organizationId: string): Promise<any[]> {
        // Find documents with similar names or types
        return this.db.document.findMany({
            where: {
                organizationId,
                id: { not: document.id },
                OR: [
                    { name: { contains: document.name.split(' ')[0] } },
                    { type: document.type },
                ],
            },
            take: 5,
        });
    }

    private async getDocumentRecipients(documentId: string): Promise<any[]> {
        return this.db.recipient.findMany({
            where: { documentId },
            select: {
                email: true,
                name: true,
                role: true,
            },
        });
    }

    private async getRecipientFrequency(email: string, organizationId: string): Promise<number> {
        const count = await this.db.recipient.count({
            where: {
                email,
                document: { organizationId },
            },
        });

        return count;
    }

    private async getLastUsedDate(email: string, organizationId: string): Promise<Date> {
        const lastRecipient = await this.db.recipient.findFirst({
            where: {
                email,
                document: { organizationId },
            },
            orderBy: { createdAt: 'desc' },
        });

        return lastRecipient?.createdAt || new Date();
    }

    private async getCreatorFrequentRecipients(createdBy: string, organizationId: string): Promise<any[]> {
        // Mock implementation
        return [
            {
                email: 'frequent@example.com',
                name: 'Frequent Collaborator',
                mostCommonRole: 'signer',
                frequency: 15,
                lastUsed: new Date(),
            },
        ];
    }

    private async getTeamMembers(organizationId: string): Promise<any[]> {
        return this.db.user.findMany({
            where: { organizationId },
            select: {
                email: true,
                name: true,
                role: true,
                department: true,
            },
            take: 10,
        });
    }

    private async getOrganizationManagers(organizationId: string): Promise<any[]> {
        return this.db.user.findMany({
            where: {
                organizationId,
                role: { in: ['manager', 'director', 'admin'] },
            },
            select: {
                email: true,
                name: true,
                role: true,
                department: true,
            },
        });
    }

    private mapMemberRoleToSigningRole(memberRole: string): 'signer' | 'approver' | 'reviewer' | 'cc' {
        const roleMap: Record<string, 'signer' | 'approver' | 'reviewer' | 'cc'> = {
            'admin': 'approver',
            'manager': 'approver',
            'director': 'approver',
            'legal': 'reviewer',
            'compliance': 'reviewer',
            'user': 'signer',
        };

        return roleMap[memberRole.toLowerCase()] || 'signer';
    }

    private async analyzeDomainPatterns(organizationId: string): Promise<{
        external: Array<{ domain: string; frequency: number }>;
        internal: Array<{ domain: string; frequency: number }>;
    }> {
        // Mock implementation
        return {
            external: [
                { domain: 'client.com', frequency: 10 },
                { domain: 'partner.org', frequency: 7 },
            ],
            internal: [
                { domain: 'company.com', frequency: 50 },
            ],
        };
    }

    private async analyzeTimingPatterns(organizationId: string): Promise<any[]> {
        // Mock implementation
        return [
            {
                email: 'morning@example.com',
                name: 'Morning Person',
                mostCommonRole: 'signer',
                pattern: { hours: [9, 10, 11], days: [1, 2, 3, 4, 5] },
                frequency: 8,
            },
        ];
    }

    private isWithinTimePattern(hour: number, day: number, pattern: any): boolean {
        return pattern.pattern.hours.includes(hour) && pattern.pattern.days.includes(day);
    }

    private formatDate(date: Date): string {
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    private async getDocument(documentId: string, organizationId: string): Promise<any> {
        return this.db.document.findFirst({
            where: {
                id: documentId,
                organizationId,
            },
        });
    }

    private async storeRecipientSuggestion(
        result: RecipientSuggestion,
        organizationId: string
    ): Promise<void> {
        await this.db.aiAnalysisResult.create({
            data: {
                id: `recipient_suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                documentId: result.documentId,
                organizationId,
                analysisType: 'recipient_suggestion',
                status: 'completed',
                result: JSON.stringify(result),
                confidence: result.suggestions.length > 0
                    ? result.suggestions.reduce((sum, s) => sum + s.confidence, 0) / result.suggestions.length
                    : 0.5,
                processingTime: result.processingTime,
                createdAt: new Date(),
                completedAt: new Date(),
            },
        });
    }
}