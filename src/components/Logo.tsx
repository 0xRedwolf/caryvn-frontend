'use client';

import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ width = 160, height = 32, className = '', style }: LogoProps) {
  return (
    <Image
      src="/svg-logo-light.svg"
      alt="Caryvn"
      width={width}
      height={height}
      className={`object-contain object-left ${className}`}
      style={{ width: 'auto', height: 'auto', ...style }}
      unoptimized
    />
  );
}
