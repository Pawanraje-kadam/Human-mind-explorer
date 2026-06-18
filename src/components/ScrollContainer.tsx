import React, { ReactNode, useRef } from 'react';

interface ScrollContainerProps {
  children: ReactNode;
  className?: string;
  height?: string;
  width?: string;
  horizontal?: boolean;
}

const ScrollContainer: React.FC<ScrollContainerProps> = ({
  children,
  className = '',
  height = '100%',
  width = '100%',
  horizontal = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={`
        ${horizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'} 
        scroll-smooth 
        ${className}
      `}
      style={{
        maxHeight: height,
        maxWidth: width,
      }}
    >
      {children}
    </div>
  );
};

export default ScrollContainer;
