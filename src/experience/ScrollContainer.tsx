import React, { ReactNode, forwardRef } from 'react';

interface ScrollContainerProps {
  children?: ReactNode;
  className?: string;
  height?: string;
  width?: string;
  horizontal?: boolean;
}

const ScrollContainer = forwardRef<HTMLDivElement, ScrollContainerProps>(({
  children,
  className = '',
  height = '100%',
  width = '100%',
  horizontal = false,
}, ref) => {
  return (
    <div
      ref={ref}
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
});

ScrollContainer.displayName = 'ScrollContainer';

export default ScrollContainer;
