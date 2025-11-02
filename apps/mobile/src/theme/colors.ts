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
  const alphaHex = Math.round(clampedAlpha * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  const normalized = normalizeHexColor(color) ?? DEFAULT_PRIMARY_COLOR;
  const hexWithoutHash = normalized.slice(1);

  // If the color already contains an alpha component, strip it before applying the new alpha value.
  const rgbHex = hexWithoutHash.length === 8 ? hexWithoutHash.slice(2) : hexWithoutHash;

  return `#${alphaHex}${rgbHex}`;
}

