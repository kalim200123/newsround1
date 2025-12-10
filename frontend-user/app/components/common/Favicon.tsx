"use client";

import { Globe } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface FaviconProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

const Favicon = ({ src, alt, size = 16, className }: FaviconProps) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    // error state is implicitly reset when src changes and Image component re-renders
  }, [src]);

  // Process the src URL to ensure HTTPS for faviconV2 links
  const processedSrc = useMemo(() => {
    if (!src) return "";

    const faviconV2Pattern = "gstatic.com/faviconV2";
    if (src.includes(faviconV2Pattern)) {
      try {
        const urlObj = new URL(src);
        const domainParam = urlObj.searchParams.get("url");
        if (domainParam && domainParam.startsWith("http://")) {
          const httpsDomainParam = domainParam.replace("http://", "https://");
          urlObj.searchParams.set("url", httpsDomainParam);
          return urlObj.toString();
        }
      } catch (e) {
        console.error("Error processing faviconV2 URL:", e);
        // Fallback to original src if parsing fails
      }
    }
    return src;
  }, [src]);

  if (error || !processedSrc) {
    // Use processedSrc here
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <Globe size={size * 0.8} className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={processedSrc} // Use processedSrc here
      alt={alt}
      width={size}
      height={size}
      className={`rounded ${className}`}
      onError={() => setError(true)}
      unoptimized={true} // Always disable optimization for external favicons to prevent upstream failures
    />
  );
};

export default Favicon;
