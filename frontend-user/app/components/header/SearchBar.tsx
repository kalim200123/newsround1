"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();

  const handleSearchIconClick = () => {
    router.push("/search");
  };

  return (
    <div className="flex items-center gap-4">
      <button onClick={handleSearchIconClick} className="p-1 rounded-full hover:bg-accent transition-colors group">
        <Search className="w-5 h-5 text-(--icon-adaptive) cursor-pointer hover:text-foreground transition-transform group-hover:scale-125" />
      </button>
    </div>
  );
}
