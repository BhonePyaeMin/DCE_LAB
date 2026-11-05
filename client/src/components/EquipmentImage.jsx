import { useState } from 'react';
import { Package } from 'lucide-react';
import { assetUrl } from '../services/api.js';
import { CATEGORY_IMAGES } from '../utils/format.js';
import { Skeleton } from './ui.jsx';

/**
 * Equipment photo. Shows a skeleton while loading and falls back to the category illustration
 * (or an icon) if the photo is missing or fails to load.
 */
export function EquipmentImage({ item, className = '', alt }) {
  const fallback = CATEGORY_IMAGES[item?.category];
  const [src, setSrc] = useState(item?.image || fallback);
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-300 ${className}`}>
        <Package size={28} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      <img
        src={assetUrl(src)}
        alt={alt ?? item?.name ?? ''}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (src !== fallback && fallback) setSrc(fallback);
          else setLoaded(true);
        }}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
