export const DEFAULT_PRIMARY_COLOR = '#A91A36';

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function normalizeHexColor(color?: string | null): string | undefined {
  if (!color) {
    return undefined;
  }

  const trimmed = color.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return undefined;
  }

  return trimmed.toUpperCase();
}

export function withAlpha(color: string, alpha: number): string {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  
  const normalized = normalizeHexColor(color) ?? DEFAULT_PRIMARY_COLOR;
  const hexWithoutHash = normalized.slice(1);

  // If the color already contains an alpha component, strip it before applying the new alpha value.
  const rgbHex = hexWithoutHash.length === 8 ? hexWithoutHash.slice(2) : hexWithoutHash;

  // Convert hex to RGB
  const r = parseInt(rgbHex.slice(0, 2), 16);
  const g = parseInt(rgbHex.slice(2, 4), 16);
  const b = parseInt(rgbHex.slice(4, 6), 16);

  // Return rgba format which is more reliable in React Native
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}

