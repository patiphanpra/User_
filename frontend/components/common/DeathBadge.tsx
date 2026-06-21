'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface DeathBadgeProps {
  date?: string;
  className?: string;
}

export const DeathBadge: React.FC<DeathBadgeProps> = ({ date, className }) => {
  return (
    <Badge variant="destructive" className={className}>
      สิ้นพระชนม์
      {date && ` ${format(new Date(date), 'd MMM yyyy', { locale: th })}`}
    </Badge>
  );
};
