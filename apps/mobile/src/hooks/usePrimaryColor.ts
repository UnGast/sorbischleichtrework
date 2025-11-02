import { useAppSelector } from '@/store';
import { DEFAULT_PRIMARY_COLOR } from '@/theme/colors';

export function usePrimaryColor(): string {
  return useAppSelector((state) => state.app.primaryColor ?? DEFAULT_PRIMARY_COLOR);
}

