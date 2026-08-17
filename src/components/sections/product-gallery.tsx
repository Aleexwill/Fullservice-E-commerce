'use client';

import { useState } from 'react';
import { Isotipo } from '@/components/ui/isotipo';

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const hasImages = images && images.length > 0;

  return (
    <div>
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-steel-900 to-steel-700">
        {hasImages ? (
          <img src={images[active]} alt={name} className="h-full w-full object-cover" />
        ) : (
          <Isotipo size={96} />
        )}
      </div>
      {images && images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                i === active ? 'border-blue' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`${name} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
