import React from 'react';

/**
 * @deprecated QR Scanning System has been decommissioned and removed from app and web.
 */
export const QrScannerModal: React.FC<{
  isOpen?: boolean;
  onClose?: () => void;
  onScanLift?: (lift: any) => void;
}> = () => null;
