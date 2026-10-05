import React from 'react';
import { LoginPage } from './LoginPage';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRolePortal?: 'technician' | 'client';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  defaultRolePortal = 'client',
}) => {
  if (!isOpen) return null;

  return (
    <LoginPage
      isOpen={isOpen}
      onClose={onClose}
      defaultRole={defaultRolePortal}
      isModal={true}
    />
  );
};
