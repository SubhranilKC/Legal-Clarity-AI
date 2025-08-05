import Spline from '@splinetool/react-spline';

export default function SplineHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Spline 3D background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Spline scene="https://prod.spline.design/G6smCUHNbVDFHZjc/scene.splinecode" />
      </div>
      {/* Overlay content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-500 drop-shadow-lg mb-4">
          Legal Clarity AI
        </h1>
        <p className="text-lg md:text-2xl text-white/90 max-w-2xl mx-auto backdrop-blur-sm bg-black/30 rounded-xl px-6 py-4 shadow-lg">
          Making legal documents clear, actionable, and accessible for everyone.
        </p>
      </div>
      {/* Optional: dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90 z-5" />
    </section>
  );
}
