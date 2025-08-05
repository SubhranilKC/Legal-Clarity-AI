
'use client';

import Link from 'next/link';
import { Home, Mail, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Footer() {

  const handleHomeClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hasVisited');
    }
  };

  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-md mt-auto">
      <div className="mx-auto flex flex-col md:flex-row h-auto md:h-16 items-center justify-center px-4 py-4 md:py-0">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <Link href="/" onClick={handleHomeClick} className={cn('navbar-link transition-colors flex items-center gap-2')}>
                <Home className="h-5 w-5" />
                <span>Home</span>
            </Link>
            <Link href="/about" className={cn('navbar-link transition-colors flex items-center gap-2')}>
                <Info className="h-5 w-5" />
                <span>About Us</span>
            </Link>
           <a href="mailto:support@legalclarity.ai" className={cn('navbar-link transition-colors flex items-center gap-2')}>
            <Mail className="h-5 w-5" />
            <span>Contact Us</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

    