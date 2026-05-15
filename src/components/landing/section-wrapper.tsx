'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type SectionWrapperProps = {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
  alt?: boolean;
};

export function SectionWrapper({
  id,
  className,
  containerClassName,
  children,
  alt = false,
}: SectionWrapperProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id={id}
      className={cn(
        'relative w-full px-6 py-24 md:py-32',
        alt && 'bg-[oklch(0.17_0.005_250)]',
        className,
      )}
    >
      <motion.div
        className={cn('mx-auto max-w-6xl', containerClassName)}
        initial={reduceMotion ? false : { opacity: 0, y: 30 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </section>
  );
}
