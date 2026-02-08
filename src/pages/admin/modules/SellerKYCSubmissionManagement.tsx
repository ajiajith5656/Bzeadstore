import React from 'react';
import { TableManager } from './TableManager';
import type { TableConfig } from './TableManager';
import { logger } from '../../../utils/logger';

export const SellerKYCSubmissionManagement: React.FC = () => {
  const config: TableConfig = {
    name: 'Seller KYC Submissions',
    fields: [
      { name: 'sellerId', type: 'text', required: true },
      { name: 'country', type: 'text', required: true },
      { name: 'registrationType', type: 'text', required: true },
      { name: 'status', type: 'text', required: true },
      { name: 'submissionDate', type: 'date' },
      { name: 'reviewedBy', type: 'text' },
      { name: 'reviewDate', type: 'date' },
      { name: 'rejectionReason', type: 'textarea' },
    ],
    onFetch: async () => {
      return [
        {
          id: '1',
          sellerId: 'seller1',
          country: 'India',
          registrationType: 'Individual',
          status: 'pending',
          submissionDate: '2026-01-31',
          reviewedBy: null,
          reviewDate: null,
          rejectionReason: null,
        },
      ];
    },
    onAdd: async (data) => {
      logger.log('KYC submission added', { data });
      return true;
    },
    onEdit: async (id, data) => {
      logger.log('KYC submission edited', { id, data });
      return true;
    },
    onDelete: async (id) => {
      logger.log('KYC submission deleted', { id });
      return true;
    },
  };

  return <TableManager config={config} />;
};
