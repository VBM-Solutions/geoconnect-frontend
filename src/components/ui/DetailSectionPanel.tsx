import React from 'react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface DetailSectionPanelProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/** Conteneur visuel commun à tous les onglets des pages de détail. */
export function DetailSectionPanel({
  title,
  children,
  className,
  contentClassName,
}: Readonly<DetailSectionPanelProps>) {
  return (
    <Card className={cn('min-w-0', className)}>
      <CardHeader>
        <CardTitle className="text-sm">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
