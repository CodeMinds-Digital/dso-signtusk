import { Outlet } from 'react-router';

import { BrandingLogo, BrandingLogoWhite } from '~/components/general/branding-logo';

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel — solid primary blue, hidden on small screens */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 lg:flex lg:w-[44%]">
        {/* Decorative tusk arcs — white at low opacity */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Large arc — bottom left */}
          <svg
            viewBox="0 0 600 600"
            className="absolute -bottom-32 -left-32 h-[500px] w-[500px] opacity-10"
          >
            <path
              d="M80 500 C80 200 200 40 360 40 C440 40 500 100 500 180 C500 260 440 310 360 310"
              stroke="white"
              strokeWidth="40"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          {/* Large arc — top right */}
          <svg
            viewBox="0 0 600 600"
            className="absolute -right-20 -top-20 h-[400px] w-[400px] rotate-180 opacity-10"
          >
            <path
              d="M80 500 C80 200 200 40 360 40 C440 40 500 100 500 180 C500 260 440 310 360 310"
              stroke="white"
              strokeWidth="30"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Logo — white on blue */}
        <div className="relative z-10">
          <BrandingLogoWhite className="h-8 w-auto" />
        </div>

        {/* Brand message */}
        <div className="relative z-10">
          <blockquote className="space-y-4">
            <p className="text-3xl font-bold leading-snug tracking-tight text-white">
              Sign with confidence.
              <br />
              <span className="text-blue-200">Built for teams.</span>
            </p>
            <p className="max-w-sm text-base leading-relaxed text-blue-100">
              Send, sign, and manage documents — all in one place. SignTusk brings clarity and speed
              to every agreement.
            </p>
          </blockquote>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-xs text-blue-200">
          &copy; {new Date().getFullYear()} SignTusk. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile logo — visible only on small screens */}
        <div className="mb-8 lg:hidden">
          <BrandingLogo className="h-7 w-auto text-primary" />
        </div>

        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
