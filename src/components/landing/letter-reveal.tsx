'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type LetterRevealProps = {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
};

export function LetterReveal({
  text,
  className,
  delay = 0,
  stagger = 0.03,
  as = 'h1',
}: LetterRevealProps) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as];

  if (reduceMotion) {
    const Static = as;
    return <Static className={className}>{text}</Static>;
  }

  const words = text.split(' ');

  return (
    <Tag
      className={cn('inline-block', className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {word.split('').map((char, ci) => (
            <motion.span
              key={ci}
              className="inline-block"
              variants={{
                hidden: { opacity: 0, y: '0.4em' },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              {char}
            </motion.span>
          ))}
          {wi < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}
