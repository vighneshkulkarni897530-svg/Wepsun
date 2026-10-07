import React from 'react';
import { useApp } from '../../context/AppContext';
import { WepsunModal } from './WepsunModal';

export const WepsunModalContainer: React.FC = () => {
  const { modal, closeModal } = useApp();

  if (!modal) return null;

  return (
    <WepsunModal
      isOpen={true}
      {...modal}
      onClose={() => {
        if (modal.onClose) {
          modal.onClose();
        }
        closeModal();
      }}
    />
  );
};

export default WepsunModalContainer;
