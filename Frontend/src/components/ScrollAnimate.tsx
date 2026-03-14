import { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface ScrollAnimateProps {
  children: ReactNode;
  className?: string;
  animation?: 'zoom-out' | 'slide-up' | 'fade-in-up' | 'scale-in';
  delay?: number;
  threshold?: number;
}

export const ScrollAnimate = ({
  children,
  className = '',
  animation = 'zoom-out',
  delay = 0,
  threshold = 0.1,
}: ScrollAnimateProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold, triggerOnce: true });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? `animate-${animation} opacity-100`
          : 'opacity-0 scale-110'
      } ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};
