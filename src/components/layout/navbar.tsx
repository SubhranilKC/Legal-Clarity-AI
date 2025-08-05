
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navLinks } from './nav-links';


export function Navbar({ className }: { className?: string }) {
    const pathname = usePathname();

    return (
        <nav className={cn("relative z-50 flex items-center space-x-6", className)}>
            {navLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        'navbar-link transition-colors font-medium',
                        pathname === link.href ? 'text-primary' : 'text-foreground/80 hover:text-primary'
                    )}
                >
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}
