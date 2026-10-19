import React from 'react';
import { TechNotificationItem } from '../../types';
import { NotificationHub } from '../common/NotificationHub';

interface TechnicianNotificationsViewProps {
  notifications?: TechNotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
  onSelectJobId?: (jobId: string) => void;
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const TechnicianNotificationsView: React.FC<TechnicianNotificationsViewProps> = ({
  onBack,
  onNavigateTab,
}) => {
  return (
    <NotificationHub
      onBack={onBack || (() => {
        if (onNavigateTab) {
          onNavigateTab('jobs');
        } else {
          window.location.hash = 'jobs';
        }
      })}
      onNavigateTab={onNavigateTab}
    />
  );
};
