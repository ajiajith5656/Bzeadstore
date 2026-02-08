import React from 'react';
import { logger } from '../../../utils/logger';
import { TableManager } from './TableManager';
import type { TableConfig } from './TableManager';

export const CountryListManagement: React.FC = () => {
  const config: TableConfig = {
    name: 'Countries',
    fields: [
      { name: 'countryName', type: 'text', required: true },
      { name: 'shortCode', type: 'text', required: true },
      { name: 'currency', type: 'text', required: true },
      { name: 'dialCode', type: 'text' },
    ],
    onFetch: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: '1',
          countryName: 'India',
          shortCode: 'IN',
          currency: 'INR',
          dialCode: '+91',
        },
        { id: '2', countryName: 'USA', shortCode: 'US', currency: 'USD', dialCode: '+1' },
        { id: '3', countryName: 'UK', shortCode: 'GB', currency: 'GBP', dialCode: '+44' },
      ];
    },
    onAdd: async (data) => {
      logger.log('Country added', { data });
      return true;
    },
    onEdit: async (id, data) => {
      logger.log('Country edited', { id, data });
      return true;
    },
    onDelete: async (id) => {
      logger.log('Country deleted', { id });
      return true;
    },
  };

  return <TableManager config={config} />;
};
