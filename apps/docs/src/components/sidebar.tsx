'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    BookOpen,
    Code,
    Play,
    FileText,
    Zap,
    Users,
    Settings,
    Webhook,
    BarChart3,
    Shield,
    Globe
} from 'lucide-react';

const navigation = [
    {
        title: 'Getting Started',
        items: [
            { name: 'Overview', href: '/', icon: BookOpen },
            { name: 'Quick Start', href: '/quick-start', icon: Zap },
            { name: 'Authentication', href: '/guides/authentication', icon: Shield }
        ]
    },
    {
        title: 'API Reference',
        items: [
            { name: 'Documents', href: '/api-reference/documents', icon: FileText },
            { name: 'Signing', href: '/api-reference/signing', icon: Code },
            { name: 'Templates', href: '/api-reference/templates', icon: FileText },
            { name: 'Users', href: '/api-reference/users', icon: Users },
            { name: 'Organizations', href: '/api-reference/organizations', icon: Settings },
            { name: 'Webhooks', href: '/api-reference/webhooks', icon: Webhook },
            { name: 'Analytics', href: '/api-reference/analytics', icon: BarChart3 }
        ]
    },
    {
        title: 'SDKs & Tools',
        items: [
            { name: 'JavaScript/TypeScript', href: '/sdks/javascript', icon: Code },
            { name: 'Python', href: '/sdks/python', icon: Code },
            { name: 'PHP', href: '/sdks/php', icon: Code },
            { name: 'C# (.NET)', href: '/sdks/dotnet', icon: Code },
            { name: 'API Playground', href: '/playground', icon: Play }
        ]
    },
    {
        title: 'Guides',
        items: [
            { name: 'Webhooks', href: '/guides/webhooks', icon: Webhook },
            { name: 'Error Handling', href: '/guides/error-handling', icon: Shield },
            { name: 'Rate Limiting', href: '/guides/rate-limiting', icon: Settings },
            { name: 'Compliance', href: '/guides/compliance', icon: Globe }
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] overflow-y-auto bg-background border-r hidden lg:block">
            <nav className="p-4 space-y-6">
                {navigation.map((section) => (
                    <div key={section.title}>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            {section.title}
                        </h3>
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
}