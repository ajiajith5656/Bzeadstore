import React from 'react';
import { logger } from '../../../utils/logger';
import { TableManager } from './TableManager';
import type { TableConfig } from './TableManager';

export const BusinessTypeManagement: React.FC = () => {
  const config: TableConfig = {
    name: 'Business Types',
    fields: [
      { name: 'typeName', type: 'text', required: true },
      { name: 'description', type: 'textarea' },
    ],
    onFetch: async () => {
      return [
        {
          id: '1',
          typeName: 'Individual',
          description: 'Solo seller or freelancer',
        },
        {
          id: '2',
          typeName: 'Partnership',
          description: 'Business partnership',
        },
        {
          id: '3',
          typeName: 'Company',
          description: 'Registered company',
        },
      ];
    },
    onAdd: async (data) => {
      logger.log('Business type added', { data });
      return true;
    },
    onEdit: async (id, data) => {
      logger.log('Business type edited', { id, data });
      return true;
    },
    onDelete: async (id) => {
      logger.log('Business type deleted', { id });
      return true;
    },
  };

  return <TableManager config={config} />;
};
