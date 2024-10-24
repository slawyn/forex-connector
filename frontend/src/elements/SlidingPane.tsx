import React from 'react';

interface SlidingPaneProps {
  customClass?: string;
  isOpen: boolean;
  child: React.ReactNode;
}

const SlidingPane: React.FC<SlidingPaneProps> = ({ customClass = '', isOpen, child }) => {
  const display = isOpen ? 'flex' : 'none';

  return (
    <nav style={{ display }} className={customClass}>
      {child}
    </nav>
  );
};

export default SlidingPane;
