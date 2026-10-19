import React from 'react';
import { NotificationHub } from '../common/NotificationHub';

interface ClientNotificationsViewProps {
  onNavigateTab?: (tab: string) => void;
  onBack?: () => void;
}

export const ClientNotificationsView: React.FC<ClientNotificationsViewProps> = ({
  onNavigateTab,
  onBack,
}) => {
  return (
    <NotificationHub
      onBack={onBack || (() => {
        if (onNavigateTab) {
          onNavigateTab('home');
        } else {
          window.location.hash = 'home';
        }
      })}
      onNavigateTab={onNavigateTab}
    />
  );
};
