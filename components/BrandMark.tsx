import React from 'react';

const BrandMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`relative inline-flex h-7 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black ${className}`}
  >
    <span className="flex gap-1">
      <span className="h-2.5 w-2.5 rounded-full border-2 border-gold bg-white/90" />
      <span className="h-2.5 w-2.5 rounded-full border-2 border-gold bg-white/90" />
    </span>
  </span>
);

export default BrandMark;
