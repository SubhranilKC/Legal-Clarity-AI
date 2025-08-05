'use client';

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
      <div className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-primary/20 animate-float-1 blur-3xl" />
      <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-accent/20 animate-float-2 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 h-1/3 w-1/3 rounded-full bg-secondary/10 animate-float-3 blur-3xl" />
    </div>
  );
}