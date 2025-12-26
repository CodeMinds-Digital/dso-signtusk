import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for checkout request
const checkoutSchema = z.object({
    plan: z.enum(['starter', 'professional', 'enterprise']),
    email: z.string().email().optional(),
    returnUrl: z.string().url().optional(),
})

// Mock pricing data - in a real app, this would come from your billing system
const planPricing = {
    starter: {
        name: 'Starter',
        price: 0,
        priceId: 'price_starter_free',
        features: ['5 documents per month', 'Basic templates', 'Email support'],
    },
    professional: {
        name: 'Professional',
        price: 1500, // $15.00 in cents
        priceId: 'price_professional_monthly',
        features: ['Unlimited documents', 'Advanced templates', 'Priority support', 'API access'],
    },
    enterprise: {
        name: 'Enterprise',
        price: null, // Custom pricing
        priceId: null,
        features: ['Everything in Professional', 'SSO integration', 'Dedicated support'],
    },
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { plan, email, returnUrl } = checkoutSchema.parse(body)

        const selectedPlan = planPricing[plan]

        if (!selectedPlan) {
            return NextResponse.json(
                { error: 'Invalid plan selected' },
                { status: 400 }
            )
        }

        // Handle free starter plan
        if (plan === 'starter') {
            return NextResponse.json({
                success: true,
                redirectUrl: '/app/signup?plan=starter',
                message: 'Redirecting to free account creation...',
            })
        }

        // Handle enterprise plan
        if (plan === 'enterprise') {
            return NextResponse.json({
                success: true,
                redirectUrl: '/contact?plan=enterprise',
                message: 'Redirecting to enterprise contact form...',
            })
        }

        // Handle professional plan - in a real app, this would create a Stripe checkout session
        // For now, we'll simulate the checkout process
        const checkoutSession = {
            id: `cs_${Date.now()}`,
            url: `/app/signup?plan=${plan}&checkout=true`,
            plan: selectedPlan,
            customer_email: email,
        }

        // In a real implementation, you would:
        // 1. Create a Stripe checkout session
        // 2. Store the session in your database
        // 3. Return the Stripe checkout URL

        /*
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: selectedPlan.priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
            customer_email: email,
            metadata: {
                plan: plan,
            },
        })
        
        return NextResponse.json({
            success: true,
            checkoutUrl: session.url,
            sessionId: session.id,
        })
        */

        return NextResponse.json({
            success: true,
            checkoutUrl: checkoutSession.url,
            sessionId: checkoutSession.id,
            plan: selectedPlan,
        })

    } catch (error) {
        console.error('Checkout error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Invalid request data',
                    details: error.errors
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Handle GET requests for plan information
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const plan = searchParams.get('plan')

    if (plan && plan in planPricing) {
        return NextResponse.json({
            success: true,
            plan: planPricing[plan as keyof typeof planPricing],
        })
    }

    return NextResponse.json({
        success: true,
        plans: planPricing,
    })
}