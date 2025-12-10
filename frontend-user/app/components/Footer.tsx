"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className={cn("w-full mt-24", "bg-carbon-fiber", "text-black dark:text-white")}>
      <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            {/* Force text-white in dark mode via style to bypass potential CSS conflicts */}
            <h3 className="footer-title">뉴스</h3>
            <ul className="space-y-2">
              {["정치", "경제", "사회", "문화"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${
                      item === "정치"
                        ? "politics"
                        : item === "경제"
                        ? "economy"
                        : item === "사회"
                        ? "social"
                        : "culture"
                    }`}
                    className="text-zinc-600 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="footer-title">토론</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/debate"
                  className="text-zinc-600 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  토론 목록
                </Link>
              </li>
              <li>
                <Link
                  href="/debate/new"
                  className="text-zinc-600 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  토론 시작하기
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="footer-title">소셜</h3>
            <ul className="space-y-2">
              {["Facebook", "Twitter", "Instagram"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-zinc-600 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="footer-title">Gemini News</h3>
            <p className="text-zinc-500 dark:text-gray-300">최신 뉴스와 심도 있는 토론을 한 곳에서 만나보세요.</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t text-center border-[#e5e5e5] dark:border-[#27272a]">
          <p className="text-zinc-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Gemini News. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
