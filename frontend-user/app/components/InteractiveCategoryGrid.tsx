"use client";

import { useState, useEffect } from 'react';
import { Article } from '@/lib/types/article';
import { getCategoryNews } from '@/lib/api/articles';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ArticleCard from './ArticleCard';
import { getCategoryTheme, CategoryTheme } from '@/lib/categoryColors';

const CATEGORIES = ["정치", "경제", "사회", "문화", "스포츠"];

const categoryStyles: { [key: string]: CategoryTheme } = {
    "정치": getCategoryTheme("정치"),
    "경제": getCategoryTheme("경제"),
    "사회": getCategoryTheme("사회"),
    "문화": getCategoryTheme("문화"),
    "스포츠": getCategoryTheme("스포츠"),
};

export default function InteractiveCategoryGrid() {
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            setIsLoading(true);
            // In a real scenario, you might fetch all categories at once
            // or fetch them as the user clicks. For this implementation,
            // we will fetch when the category changes.
            const news = await getCategoryNews(selectedCategory, 5); // Fetch 5 articles for the grid
            setArticles(news);
            setIsLoading(false);
        };
        fetchArticles();
    }, [selectedCategory]);

    return (
        <section className="py-12">
            <h2 className="text-3xl font-bold text-center mb-8">카테고리별 주요 뉴스</h2>
            
            {/* Category Tabs */}
            <div className="flex justify-center items-center gap-2 md:gap-4 mb-8">
                {CATEGORIES.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                            "px-4 py-2 text-sm md:text-base font-bold rounded-full transition-all duration-300 transform hover:scale-105",
                            selectedCategory === category
                                ? `${categoryStyles[category].bg} text-white shadow-lg`
                                : "bg-card text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Articles Grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedCategory}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {isLoading ? (
                        Array.from({ length: 7 }).map((_, i) => (
                           <div key={i} className="h-64 bg-muted rounded-xl animate-pulse"></div>
                        ))
                    ) : (
                        articles.map((article, index) => {
                            // First article is the "hero"
                            if (index === 0) {
                                return (
                                    <motion.div key={article.id} className="md:col-span-2 lg:col-span-2 lg:row-span-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <ArticleCard article={article} variant="hero" />
                                    </motion.div>
                                );
                            }
                            // Other articles
                            return (
                                <motion.div key={article.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <ArticleCard article={article} variant="standard" />
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>
            </AnimatePresence>
        </section>
    );
}
