import React from 'react';
import { NotificationHub } from '../common/NotificationHub';
import { NavTabId } from '../layout/Sidebar';

interface AdminNotificationsViewProps {
  onNavigateTab?: (tab: NavTabId | string) => void;
  onBack?: () => void;
}

export const AdminNotificationsView: React.FC<AdminNotificationsViewProps> = ({
  onNavigateTab,
  onBack,
}) => {
  return (
    <NotificationHub
      onBack={onBack || (() => {
        if (onNavigateTab) {
          onNavigateTab('dashboard');
        } else {
          window.location.hash = 'dashboard';
        }
      })}
      onNavigateTab={onNavigateTab}
    />
  );
};
