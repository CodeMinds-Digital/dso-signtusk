'use client';

import { TrpcProvider } from '../lib/trpc';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <TrpcProvider>
            {children}
        </TrpcProvider>
    );
}