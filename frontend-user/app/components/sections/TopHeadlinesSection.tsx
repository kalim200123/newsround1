"use client";

import { Article } from "@/lib/types/article";
import SectionGrid from "../SectionGrid";

interface TopHeadlinesSectionProps {
  articles: Article[];
}

export default function TopHeadlinesSection({ articles }: TopHeadlinesSectionProps) {
  return (
    <section className="pb-8 border-b border-border">
      <h2 className="sr-only">주요 뉴스</h2>
      <SectionGrid articles={articles} variant="1+4" />
    </section>
  );
}
