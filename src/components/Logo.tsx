'use client';

import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ width = 240, height = 80, className = '', style }: LogoProps) {
  const { theme } = useTheme();

  return (
    <Image
      src={theme === 'dark' ? '/svg-logo-dark.svg' : '/svg-logo-light.svg'}
      alt="Caryvn"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      style={style}
      priority
    />
  );
}
