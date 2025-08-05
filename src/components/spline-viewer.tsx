
'use client';

import Spline from '@splinetool/react-spline';

export default function SplineViewer() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Underlayer Spline */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Spline scene="https://prod.spline.design/G6smCUHNbVDFHZjc/scene.splinecode" />
      </div>
      {/* Main Spline overlay */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Spline scene="https://prod.spline.design/sfNjOXXszEXoaWwE/scene.splinecode" />
      </div>
    </div>
  );
}
