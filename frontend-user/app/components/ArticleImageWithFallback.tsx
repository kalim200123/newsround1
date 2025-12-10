'use client';

import { useState, useEffect } from "react";
import { ImageProps } from "next/image";

interface ArticleImageWithFallbackProps extends Omit<ImageProps, 'src' | 'width' | 'height'> {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
}

export default function ArticleImageWithFallback({ 
  src, 
  alt, 
  className,
  style,
  fill,
}: ArticleImageWithFallbackProps) {
    const [hasError, setHasError] = useState(!src);
  
    useEffect(() => {
      if (!src) {
        return; // Already handled by initial state
      }
  
      const image = new window.Image();
      image.src = src;
      image.onerror = () => {
        Promise.resolve().then(() => setHasError(true)); // Defer state update
      };
    }, [src]);

  const finalStyle = {
    ...style,
    backgroundImage: `url(${hasError ? '/user-placeholder.svg' : src})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  // If fill is true, add classes to make the div fill its relative parent
  const fillClasses = fill ? 'absolute inset-0' : '';

  return (
    <div 
      className={`${className || ''} ${fillClasses}`} 
      style={finalStyle} 
      role="img" 
      aria-label={alt}
    ></div>
  );
}