import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
// import { createEmailServiceFromEnv } from '@signtusk/email'

// Temporary stub for email service
const createEmailServiceFromEnv = () => ({
    sendEmail: async (options: any) => {
        console.log('Email would be sent:', options)
        // In a real implementation, this would send actual emails
        return Promise.resolve()
    }
})

// Validation schema for contact form
const contactFormSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Invalid email address'),
    company: z.string().max(100).optional(),
    subject: z.enum(['sales', 'support', 'partnership', 'demo', 'billing', 'other']),
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
    consent: z.literal('on', {
        errorMap: () => ({ message: 'You must agree to receive communications' })
    }),
})

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()

        // Convert FormData to object
        const data = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            email: formData.get('email') as string,
            company: formData.get('company') as string || undefined,
            subject: formData.get('subject') as string,
            message: formData.get('message') as string,
            consent: formData.get('consent') as string,
        }

        // Validate the form data
        const validatedData = contactFormSchema.parse(data)

        // Create email service
        const emailService = createEmailServiceFromEnv()

        // Subject mapping
        const subjectMap = {
            sales: 'Sales Inquiry',
            support: 'Technical Support Request',
            partnership: 'Partnership Opportunity',
            demo: 'Demo Request',
            billing: 'Billing Question',
            other: 'General Inquiry',
        }

        // Send notification email to internal team
        await emailService.sendEmail({
            to: process.env.CONTACT_EMAIL || 'contact@signtusk.com',
            subject: `New Contact Form Submission: ${subjectMap[validatedData.subject]}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                        New Contact Form Submission
                    </h2>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #374151;">Contact Information</h3>
                        <p><strong>Name:</strong> ${validatedData.firstName} ${validatedData.lastName}</p>
                        <p><strong>Email:</strong> <a href="mailto:${validatedData.email}">${validatedData.email}</a></p>
                        ${validatedData.company ? `<p><strong>Company:</strong> ${validatedData.company}</p>` : ''}
                        <p><strong>Subject:</strong> ${subjectMap[validatedData.subject]}</p>
                    </div>
                    
                    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                        <h3 style="margin-top: 0; color: #374151;">Message</h3>
                        <p style="white-space: pre-wrap; line-height: 1.6;">${validatedData.message}</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb;">
                        <p style="margin: 0; font-size: 14px; color: #1e40af;">
                            <strong>Next Steps:</strong> Please respond to this inquiry within 2 hours during business hours.
                        </p>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                        <p>This email was sent from the Signtusk contact form at ${new Date().toLocaleString()}.</p>
                    </div>
                </div>
            `,
        })

        // Send confirmation email to the user
        await emailService.sendEmail({
            to: validatedData.email,
            subject: 'Thank you for contacting us - We\'ll be in touch soon',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
                        <h1 style="color: #2563eb; margin: 0;">Signtusk</h1>
                    </div>
                    
                    <div style="padding: 30px 0;">
                        <h2 style="color: #374151;">Thank you for reaching out!</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                            Hi ${validatedData.firstName},
                        </p>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                            We've received your message regarding <strong>${subjectMap[validatedData.subject].toLowerCase()}</strong> 
                            and our team will get back to you within 2 hours during business hours.
                        </p>
                        
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #374151;">Your Message Summary</h3>
                            <p><strong>Subject:</strong> ${subjectMap[validatedData.subject]}</p>
                            <p><strong>Message:</strong></p>
                            <p style="white-space: pre-wrap; background-color: #ffffff; padding: 15px; border-radius: 4px; border: 1px solid #e5e7eb;">${validatedData.message}</p>
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                            In the meantime, feel free to explore our resources:
                        </p>
                        
                        <div style="margin: 20px 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" 
                               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px; margin-bottom: 10px;">
                                Support Center
                            </a>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/blog" 
                               style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px; margin-bottom: 10px;">
                                Blog & Resources
                            </a>
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                            Best regards,<br>
                            The Signtusk Team
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
                        <p>
                            Signtusk | 123 Innovation Drive, San Francisco, CA 94105<br>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color: #6b7280;">Unsubscribe</a> | 
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #6b7280;">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            `,
        })

        // Return success response
        return NextResponse.json(
            {
                success: true,
                message: 'Thank you for your message. We\'ll get back to you soon!'
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Contact form error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Please check your form data and try again.',
                    errors: error.errors
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong. Please try again later.'
            },
            { status: 500 }
        )
    }
}