import React from 'react';
import { LoginPage } from './LoginPage';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRolePortal?: 'admin' | 'technician' | 'client';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  defaultRolePortal = 'admin',
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
