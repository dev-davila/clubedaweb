// Estado global compartilhado para geração de imagens em background
export interface ImageGenStatus {
  running: boolean;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentPost: string;
  errors: string[];
  startedAt: string;
  finishedAt: string | null;
  serviceType?: string;
}

const globalStatus: { current: ImageGenStatus | null } = { current: null };

export function getImageGenStatus(): ImageGenStatus | null {
  return globalStatus.current;
}

export function setImageGenStatus(status: ImageGenStatus | null) {
  globalStatus.current = status;
}
