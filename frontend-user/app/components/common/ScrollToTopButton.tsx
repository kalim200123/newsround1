"use client";

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from 'next-themes'; // Import useTheme
import { cn } from '@/lib/utils';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useTheme(); // Get current theme

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const gloveSrc = theme === 'light' ? '/red--glove.svg' : '/blue--glove.svg';
  const rotationClass = theme === 'light' ? 'rotate-90' : '-rotate-90'; // Red glove needs +90deg, Blue glove needs -90deg to point left

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          className={cn(
            'fixed bottom-8 right-8 z-50',
            'w-14 h-14 rounded-full bg-primary/80 backdrop-blur-sm',
            'flex items-center justify-center',
            'shadow-lg hover:bg-primary transition-all duration-300 group'
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          aria-label="Scroll to top"
        >
          <Image
            src={gloveSrc}
            alt="Scroll to top"
            width={32}
            height={32}
            className={cn("group-hover:scale-110 transition-transform", rotationClass)}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
