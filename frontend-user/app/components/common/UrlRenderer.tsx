"use client";

export default function UrlRenderer({ url }: { url: string }) {
    // The backend endpoint for metadata is not available.
    // Defaulting to rendering a simple link to prevent 404 errors.
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {url}
        </a>
    );
}
