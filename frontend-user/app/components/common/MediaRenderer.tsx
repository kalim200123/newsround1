"use client";

import Image from "next/image";
import { Download, Loader2 } from "lucide-react";
import React, { useState, useMemo } from "react";
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from "@/lib/constants";

interface MediaRendererProps {
  url: string;
  onZoom: (url: string) => void;
  onDownload: (url: string, filename: string) => Promise<void>;
  isDownloading: boolean;
}

function getInitialMediaType(url: string): 'image' | 'video' | 'unknown' {
    try {
        const pathname = new URL(url).pathname.toLowerCase();
        const extension = pathname.substring(pathname.lastIndexOf("."));
        if (IMAGE_EXTENSIONS.includes(extension)) return 'image';
        if (VIDEO_EXTENSIONS.includes(extension)) return 'video';
    } catch {
        // Not a valid URL, but might be a base64 string or something else renderable.
    }
    return 'unknown';
}

export default function MediaRenderer({ url, onZoom, onDownload, isDownloading }: MediaRendererProps) {
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'error'>(() => {
      const initial = getInitialMediaType(url);
      // Start by optimistically trying to render as an image if the type is unknown
      return initial === 'unknown' ? 'image' : initial;
  });

  const filename = useMemo(() => {
    try {
        return decodeURIComponent(new URL(url).pathname.substring(new URL(url).pathname.lastIndexOf("/") + 1)) || "media";
    } catch {
        return "media";
    }
  }, [url]);

  const mediaWrapper = (children: React.ReactNode) => (
    <div className="relative group/media mt-2 max-w-[300px] max-h-[350px] rounded-lg overflow-hidden">
      {children}
      <button
        onClick={() => onDownload(url, filename)}
        className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white opacity-0 group-hover/media:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-wait z-10"
        title={`Download ${filename}`}
        disabled={isDownloading}
      >
        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
    </div>
  );

  if (mediaType === 'error') {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {url}
        </a>
      );
  }

  if (mediaType === 'image') {
    return mediaWrapper(
      <Image
        src={url}
        alt="User uploaded content"
        width={400}
        height={400}
        className="bg-black/20 w-full h-full object-contain cursor-pointer"
        unoptimized
        onClick={() => onZoom(url)}
        onError={() => setMediaType('video')} // If it's not an image, try rendering as a video
      />
    );
  }

  if (mediaType === 'video') {
    return mediaWrapper(
        <video 
            src={url} 
            controls 
            className="bg-black w-full h-full object-contain"
            onError={() => setMediaType('error')} // If it's not a video either, fallback to a link
        />
    );
  }

  return null; // Should not be reached
}
