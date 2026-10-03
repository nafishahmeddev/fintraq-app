import { UI_ICONS } from "./icons";

import { useTheme } from '@/src/providers/ThemeProvider';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React from 'react';

import type { IconName } from './icons';

export type { IconName };

/** Visual emphasis, expressed as stroke width. */
export type IconWeight = 'light' | 'regular' | 'bold';

export type IconFamily = 'hugeicons';

export type IconRegistry = {
  hugeicons: IconName | (string & {});
};

export type IconProps<F extends IconFamily = 'hugeicons'> = {
  family?: F;
  name: IconRegistry[F];
  size?: number;
  color?: string;
  weight?: IconWeight | 'fill' | 'duotone';
};

const STROKE: Record<string, number> = { light: 1.25, regular: 1.5, duotone: 1.5, bold: 2, fill: 2 };

export const Icon = React.memo(function Icon<F extends IconFamily = 'hugeicons'>({
  family = 'hugeicons' as F,
  name,
  size = 20,
  color,
  weight = 'regular',
}: IconProps<F>) {
  const { colors } = useTheme();

  if (family === 'hugeicons') {
    const iconSource = (UI_ICONS as any)[name as any];
    if (!iconSource) return null;
    return <HugeiconsIcon icon={iconSource} size={size} color={color ?? colors.text} strokeWidth={STROKE[weight] ?? 1.5} />;
  }

  return null;
});
