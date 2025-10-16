import { useAppSelector } from '@/store';

export function useActivePackId() {
  return useAppSelector((state) => state.app.activePackId);
}


