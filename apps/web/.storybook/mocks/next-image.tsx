import React from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

// Mock Next.js Image component for Storybook
export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  quality,
  placeholder,
  blurDataURL,
  ...props
}: ImageProps) {
  const style: React.CSSProperties = fill
    ? { objectFit: 'cover', width: '100%', height: '100%', position: 'absolute' }
    : {};

  return (
    <img
      src={typeof src === 'string' ? src : ''}
      alt={alt}
      width={typeof width === 'number' ? width : undefined}
      height={typeof height === 'number' ? height : undefined}
      style={style}
      {...props}
    />
  );
}

