
import { Scale } from 'lucide-react';
import { Navbar } from './navbar';
import { cn } from '@/lib/utils';
import { MobileNav } from './mobile-nav';

export default function Header() {
  return (
    <header className="border-b border-border/50 bg-background/50 sticky top-0 z-20 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-4">
        <div className="flex items-center">
          <Scale className="h-7 w-7 text-primary" />
          <h1 className={cn('text-2xl font-bold', 'navbar-link')}>
            Legal Clarity AI
          </h1>
        </div>
        <Navbar className="hidden md:flex" />
        <MobileNav className="md:hidden" />
      </div>
    </header>
  );
}
