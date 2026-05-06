import { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export function resolveIcon(
  icon: string | null | undefined,
  fallback: IoniconName,
): IoniconName {
  if (icon && icon in Ionicons.glyphMap) return icon as IoniconName;
  if (icon) {
    const outlined = `${icon}-outline` as IoniconName;
    if (outlined in Ionicons.glyphMap) return outlined;
  }
  return fallback;
}
