import { LinkMetadata } from "@/lib/types/shared";
import React from "react";
import Favicon from "./Favicon"; // Import Favicon

const LinkPreviewCard: React.FC<LinkMetadata> = ({ url, title, description, image, favicon }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
    >
      <div className="relative shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-muted">
        {image && <img src={image} alt="" className="object-cover w-full h-full" />}
      </div>
      <div className="p-3 sm:p-4 flex flex-col justify-center min-w-0 grow">
        {title && <p className="text-sm font-medium text-foreground line-clamp-2">{title}</p>}
        {description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>}
        <div className="flex items-center mt-2">
          {favicon && <Favicon src={favicon} alt="Favicon" size={16} className="mr-1" />}
          <span className="text-xs text-primary truncate">{new URL(url).hostname}</span>
        </div>
      </div>
    </a>
  );
};

export default LinkPreviewCard;
