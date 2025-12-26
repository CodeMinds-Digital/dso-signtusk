import { pino } from 'pino';
import {
    TemplateWizardState,
    TemplateWizardStep,
    TemplateCreate,
    TemplateField,
    TemplateRecipient,
    WorkflowConfig,
    RecipientRoleDefinition,
    TemplateValidationResult,
} from './types';
import { TemplateService } from './template-service';

const logger = pino({ name: 'template-wizard' });

export class TemplateWizard {
    private state: TemplateWizardState;
    private templateService: TemplateService;

    constructor(templateService: TemplateService, initialTemplate?: Partial<TemplateCreate>) {
        this.templateService = templateService;
        this.state = {
            currentStep: 'document-selection',
            completedSteps: [],
            template: initialTemplate || {},
            validation: {
                isValid: false,
                errors: {},
            },
        };
    }

    /**
     * Get current wizard state
     */
    getState(): TemplateWizardState {
        return { ...this.state };
    }

    /**
     * Navigate to a specific step
     */
    goToStep(step: TemplateWizardStep): { success: boolean; errors?: string[] } {
        const stepOrder: TemplateWizardStep[] = [
            'document-selection',
            'field-placement',
            'recipient-setup',
            'workflow-configuration',
            'settings-review',
            'completion',
        ];

        const currentIndex = stepOrder.indexOf(this.state.currentStep);
        const targetIndex = stepOrder.indexOf(step);

        // Check if we can navigate to the target step
        if (targetIndex > currentIndex + 1) {
            // Can't skip steps forward
            return {
                success: false,
                errors: ['Cannot skip steps. Please complete the current step first.'],
            };
        }

        // Validate current step before moving forward
        if (targetIndex > currentIndex) {
            const validation = this.validateCurrentStep();
            if (!validation.success) {
                return validation;
            }

            // Mark current step as completed
            if (!this.state.completedSteps.includes(this.state.currentStep)) {
                this.state.completedSteps.push(this.state.currentStep);
            }
        }

        this.state.currentStep = step;
        this.updateValidation();

        logger.info({ step, userId: 'current-user' }, 'Wizard step changed');

        return { success: true };
    }

    /**
     * Update document selection
     */
    setDocument(documentId: string, documentName: string): { success: boolean; errors?: string[] } {
        if (!documentId || !documentName) {
            return {
                success: false,
                errors: ['Document ID and name are required'],
            };
        }

        this.state.template.documentId = documentId;
        this.state.template.name = this.state.template.name || `${documentName} Template`;

        this.updateValidation();

        return { success: true };
    }

    /**
     * Update template basic information
     */
    updateBasicInfo(info: {
        name?: string;
        description?: string;
        category?: string;
        tags?: string[];
        isPublic?: boolean;
    }): { success: boolean; errors?: string[] } {
        if (info.name !== undefined) {
            if (!info.name.trim()) {
                return {
                    success: false,
                    errors: ['Template name is required'],
                };
            }
            this.state.template.name = info.name;
        }

        if (info.description !== undefined) {
            this.state.template.description = info.description || undefined;
        }

        if (info.category !== undefined) {
            this.state.template.category = info.category || undefined;
        }

        if (info.tags !== undefined) {
            // Preserve all tags as provided, including whitespace-only tags
            this.state.template.tags = info.tags || [];
        }

        if (info.isPublic !== undefined) {
            this.state.template.isPublic = info.isPublic;
        }

        this.updateValidation();

        return { success: true };
    }

    /**
     * Add or update a field
     */
    setField(field: TemplateField): { success: boolean; errors?: string[] } {
        if (!this.state.template.fields) {
            this.state.template.fields = [];
        }

        // Validate field
        const errors: string[] = [];

        if (!field.name || !field.name.trim()) {
            errors.push('Field name is required');
        }

        // Enhanced field name validation
        if (field.name && field.name.trim()) {
            const trimmedName = field.name.trim();

            // Check for valid field name format
            if (trimmedName.length < 2) {
                errors.push('Field name must be at least 2 characters long');
            }

            // Check for invalid characters (only allow alphanumeric, spaces, hyphens, underscores)
            if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
                errors.push('Field name can only contain letters, numbers, spaces, hyphens, and underscores');
            }

            // Check if name is only special characters
            if (/^[\s\-_!@#$%^&*()+={}[\]|\\:";'<>?,./]+$/.test(trimmedName)) {
                errors.push('Field name cannot consist only of special characters');
            }
        }

        if (field.x < 0 || field.y < 0) {
            errors.push('Field position cannot be negative');
        }

        if (field.width <= 0 || field.height <= 0) {
            errors.push('Field size must be positive');
        }

        if (field.page < 1) {
            errors.push('Page number must be at least 1');
        }

        // Check for duplicate field names (only if field name is valid)
        if (field.name && field.name.trim()) {
            const existingFieldIndex = this.state.template.fields.findIndex(
                f => f.name === field.name && f.id !== field.id
            );

            if (existingFieldIndex !== -1) {
                errors.push(`Field name "${field.name}" already exists`);
            }
        }

        // Return early if validation fails - don't add the field
        if (errors.length > 0) {
            return { success: false, errors };
        }

        // Add or update field only if validation passes
        if (field.id) {
            const index = this.state.template.fields.findIndex(f => f.id === field.id);
            if (index !== -1) {
                this.state.template.fields[index] = field;
            } else {
                this.state.template.fields.push(field);
            }
        } else {
            field.id = this.generateId();
            this.state.template.fields.push(field);
        }

        this.updateValidation();

        return { success: true };
    }

    /**
     * Remove a field
     */
    removeField(fieldId: string): { success: boolean } {
        if (!this.state.template.fields) {
            return { success: false };
        }

        const index = this.state.template.fields.findIndex(f => f.id === fieldId);
        if (index !== -1) {
            this.state.template.fields.splice(index, 1);
            this.updateValidation();
            return { success: true };
        }

        return { success: false };
    }

    /**
     * Add or update a recipient
     */
    setRecipient(recipient: TemplateRecipient): { success: boolean; errors?: string[] } {
        if (!this.state.template.recipients) {
            this.state.template.recipients = [];
        }

        // Validate recipient
        const errors: string[] = [];

        if (!recipient.role || !recipient.role.trim()) {
            errors.push('Recipient role is required');
        }

        // Enhanced recipient role validation
        if (recipient.role && recipient.role.trim()) {
            const trimmedRole = recipient.role.trim();

            // Check for valid role format
            if (trimmedRole.length < 2) {
                errors.push('Recipient role must be at least 2 characters long');
            }

            // Check for invalid characters (only allow alphanumeric, spaces, hyphens, underscores)
            if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedRole)) {
                errors.push('Recipient role can only contain letters, numbers, spaces, hyphens, and underscores');
            }

            // Check if role is only special characters
            if (/^[\s\-_!@#$%^&*()+={}[\]|\\:";'<>?,./]+$/.test(trimmedRole)) {
                errors.push('Recipient role cannot consist only of special characters');
            }
        }

        if (recipient.order <= 0) {
            errors.push('Recipient order must be positive');
        }

        if (recipient.email && !this.isValidEmail(recipient.email)) {
            errors.push('Invalid email address');
        }

        // Check for duplicate roles (only if role is valid)
        if (recipient.role && recipient.role.trim()) {
            const existingRecipientIndex = this.state.template.recipients.findIndex(
                r => r.role === recipient.role && r.id !== recipient.id
            );

            if (existingRecipientIndex !== -1) {
                errors.push(`Recipient role "${recipient.role}" already exists`);
            }
        }

        // Check for duplicate orders
        const existingOrderIndex = this.state.template.recipients.findIndex(
            r => r.order === recipient.order && r.id !== recipient.id
        );

        if (existingOrderIndex !== -1) {
            errors.push(`Order ${recipient.order} is already used by another recipient`);
        }

        // Return early if validation fails - don't add the recipient
        if (errors.length > 0) {
            return { success: false, errors };
        }

        // Add or update recipient only if validation passes
        if (recipient.id) {
            const index = this.state.template.recipients.findIndex(r => r.id === recipient.id);
            if (index !== -1) {
                this.state.template.recipients[index] = recipient;
            } else {
                this.state.template.recipients.push(recipient);
            }
        } else {
            recipient.id = this.generateId();
            this.state.template.recipients.push(recipient);
        }

        this.updateValidation();

        return { success: true };
    }

    /**
     * Remove a recipient
     */
    removeRecipient(recipientId: string): { success: boolean } {
        if (!this.state.template.recipients) {
            return { success: false };
        }

        const index = this.state.template.recipients.findIndex(r => r.id === recipientId);
        if (index !== -1) {
            const removedRecipient = this.state.template.recipients[index];
            this.state.template.recipients.splice(index, 1);

            // Remove fields assigned to this recipient
            if (this.state.template.fields) {
                this.state.template.fields = this.state.template.fields.filter(
                    f => f.recipientRole !== removedRecipient.role
                );
            }

            this.updateValidation();
            return { success: true };
        }

        return { success: false };
    }

    /**
     * Set workflow configuration
     */
    setWorkflow(workflow: WorkflowConfig): { success: boolean; errors?: string[] } {
        // Validate workflow
        const errors: string[] = [];

        if (!workflow.steps || workflow.steps.length === 0) {
            errors.push('Workflow must have at least one step');
        } else {
            const stepIds = new Set<string>();
            workflow.steps.forEach((step, index) => {
                if (stepIds.has(step.id)) {
                    errors.push(`Duplicate step ID: ${step.id}`);
                }
                stepIds.add(step.id);

                if (!step.name.trim()) {
                    errors.push(`Step ${index + 1} name is required`);
                }

                if (!step.recipients || step.recipients.length === 0) {
                    errors.push(`Step "${step.name}" must have at least one recipient`);
                }
            });
        }

        if (errors.length > 0) {
            return { success: false, errors };
        }

        this.state.template.workflow = workflow;
        this.updateValidation();

        return { success: true };
    }

    /**
     * Set template settings
     */
    setSettings(settings: TemplateCreate['settings']): { success: boolean } {
        // Ensure we have default values for required settings
        const defaultSettings: TemplateCreate['settings'] = {
            allowDuplication: true,
            requireApproval: false,
            defaultLanguage: 'en',
            autoReminders: true,
            brandingEnabled: false,
        };

        this.state.template.settings = {
            ...defaultSettings,
            ...this.state.template.settings,
            ...settings,
        };

        this.updateValidation();

        return { success: true };
    }

    /**
     * Get available recipient roles based on current recipients
     */
    getAvailableRecipientRoles(): RecipientRoleDefinition[] {
        const defaultRoles: RecipientRoleDefinition[] = [
            {
                name: 'Signer',
                description: 'Can sign documents',
                permissions: {
                    canSign: true,
                    canApprove: false,
                    canReview: false,
                    canDelegate: false,
                    mustAuthenticate: false,
                },
                order: 1,
                isRequired: true,
                color: '#3B82F6',
            },
            {
                name: 'Approver',
                description: 'Can approve documents before signing',
                permissions: {
                    canSign: false,
                    canApprove: true,
                    canReview: true,
                    canDelegate: false,
                    mustAuthenticate: true,
                },
                order: 1,
                isRequired: true,
                color: '#10B981',
            },
            {
                name: 'Reviewer',
                description: 'Can review documents (read-only)',
                permissions: {
                    canSign: false,
                    canApprove: false,
                    canReview: true,
                    canDelegate: false,
                    mustAuthenticate: false,
                },
                order: 1,
                isRequired: false,
                color: '#F59E0B',
            },
            {
                name: 'CC',
                description: 'Receives copy of completed document',
                permissions: {
                    canSign: false,
                    canApprove: false,
                    canReview: true,
                    canDelegate: false,
                    mustAuthenticate: false,
                },
                order: 999,
                isRequired: false,
                color: '#6B7280',
            },
        ];

        return defaultRoles;
    }

    /**
     * Validate current step
     */
    private validateCurrentStep(): { success: boolean; errors?: string[] } {
        const errors: string[] = [];

        switch (this.state.currentStep) {
            case 'document-selection':
                if (!this.state.template.documentId) {
                    errors.push('Please select a document');
                }
                if (!this.state.template.name?.trim()) {
                    errors.push('Please enter a template name');
                }
                break;

            case 'field-placement':
                if (!this.state.template.fields || this.state.template.fields.length === 0) {
                    errors.push('Please add at least one field');
                }
                break;

            case 'recipient-setup':
                if (!this.state.template.recipients || this.state.template.recipients.length === 0) {
                    errors.push('Please add at least one recipient');
                }
                // Check if all fields have recipient assignments
                if (this.state.template.fields) {
                    const unassignedFields = this.state.template.fields.filter(
                        f => !f.recipientRole || f.recipientRole.trim() === ''
                    );
                    if (unassignedFields.length > 0) {
                        errors.push(`${unassignedFields.length} field(s) need recipient assignment`);
                    }
                }
                break;

            case 'workflow-configuration':
                // Workflow is optional, but if provided, validate it
                if (this.state.template.workflow) {
                    if (!this.state.template.workflow.steps || this.state.template.workflow.steps.length === 0) {
                        errors.push('Workflow must have at least one step');
                    }
                }
                break;

            case 'settings-review':
                // Final validation
                if (!this.state.template.name?.trim()) {
                    errors.push('Template name is required');
                }
                if (!this.state.template.documentId) {
                    errors.push('Document is required');
                }
                break;
        }

        return {
            success: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    /**
     * Update validation state
     */
    private updateValidation(): void {
        const stepValidation = this.validateCurrentStep();

        this.state.validation = {
            isValid: stepValidation.success,
            errors: stepValidation.errors ? { [this.state.currentStep]: stepValidation.errors } : {},
        };
    }

    /**
     * Generate a unique ID
     */
    private generateId(): string {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }

    /**
     * Validate email address
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Get template data for creation
     */
    getTemplateData(): TemplateCreate {
        // Ensure we have default values for required settings
        const defaultSettings: TemplateCreate['settings'] = {
            allowDuplication: true,
            requireApproval: false,
            defaultLanguage: 'en',
            autoReminders: true,
            brandingEnabled: false,
        };

        return {
            name: this.state.template.name || '',
            description: this.state.template.description,
            documentId: this.state.template.documentId || '',
            category: this.state.template.category,
            tags: this.state.template.tags || [],
            isPublic: this.state.template.isPublic ?? false,
            fields: this.state.template.fields || [],
            recipients: this.state.template.recipients || [],
            workflow: this.state.template.workflow,
            settings: {
                ...defaultSettings,
                ...this.state.template.settings,
            },
        };
    }

    /**
     * Validate complete template
     */
    async validateTemplate(): Promise<TemplateValidationResult> {
        const templateData = this.getTemplateData();
        return await this.templateService.validateTemplate(templateData);
    }

    /**
     * Reset wizard to initial state
     */
    reset(initialTemplate?: Partial<TemplateCreate>): void {
        this.state = {
            currentStep: 'document-selection',
            completedSteps: [],
            template: initialTemplate || {},
            validation: {
                isValid: false,
                errors: {},
            },
        };
    }

    /**
     * Get progress percentage
     */
    getProgress(): number {
        const totalSteps = 6; // Total number of steps
        const completedCount = this.state.completedSteps.length;

        // Add current step if it's valid
        if (this.state.validation.isValid) {
            return Math.min(((completedCount + 1) / totalSteps) * 100, 100);
        }

        return (completedCount / totalSteps) * 100;
    }

    /**
     * Check if wizard can proceed to next step
     */
    canProceed(): boolean {
        return this.state.validation.isValid;
    }

    /**
     * Get next step
     */
    getNextStep(): TemplateWizardStep | null {
        const stepOrder: TemplateWizardStep[] = [
            'document-selection',
            'field-placement',
            'recipient-setup',
            'workflow-configuration',
            'settings-review',
            'completion',
        ];

        const currentIndex = stepOrder.indexOf(this.state.currentStep);
        if (currentIndex < stepOrder.length - 1) {
            return stepOrder[currentIndex + 1];
        }

        return null;
    }

    /**
     * Get previous step
     */
    getPreviousStep(): TemplateWizardStep | null {
        const stepOrder: TemplateWizardStep[] = [
            'document-selection',
            'field-placement',
            'recipient-setup',
            'workflow-configuration',
            'settings-review',
            'completion',
        ];

        const currentIndex = stepOrder.indexOf(this.state.currentStep);
        if (currentIndex > 0) {
            return stepOrder[currentIndex - 1];
        }

        return null;
    }
}