import mitt from 'mitt';
import { TeleportEventPayload } from '@/types/contracts';

type Events = {
  TELEPORT_EVENT: TeleportEventPayload;
  CROSSHAIR_MOVE: { timestamp: number; price: number };
  CHART_SYNC_SCROLL: { logicalRange: { from: number; to: number } };
};

export const eventBus = mitt<Events>();