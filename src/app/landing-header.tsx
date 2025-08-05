
'use client';

import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LandingHeader() {
    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="fixed top-0 left-0 right-0 z-50 bg-transparent text-white"
        >
            <div className="flex h-16 w-full items-center justify-between px-4">
                <div className="flex items-center">
                    <Scale className="h-7 w-7 text-primary" />
                    <h1 className={cn('text-2xl font-bold', 'navbar-link')}>
                        Legal Clarity AI
                    </h1>
                </div>
                 <nav className="flex items-center space-x-6">
                    <Link href="/" className="navbar-link transition-colors font-medium">Home</Link>
                    <Link href="/about" className="navbar-link transition-colors font-medium">About Us</Link>
                    <a href="mailto:support@legalclarity.ai" className="navbar-link transition-colors font-medium">Contact Us</a>
                </nav>
            </div>
        </motion.header>
    )
}
