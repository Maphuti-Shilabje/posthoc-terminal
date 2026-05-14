import { eventBus } from './eventBus';

describe('Ephemeral Event Bus', () => {
  afterEach(() => {
    // Clear all handlers
    eventBus.all.clear();
  });

  it('should emit and receive TELEPORT_EVENT correctly', () => {
    const mockHandler = jest.fn();
    const payload = {
      timestamp: 1610000000000,
      price_range: [40000, 41000] as [number, number],
      context_padding: 50,
      timeframe_hint: 'M15',
    };

    eventBus.on('TELEPORT_EVENT', mockHandler);
    eventBus.emit('TELEPORT_EVENT', payload);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(payload);
  });

  it('should handle unsubscription', () => {
    const mockHandler = jest.fn();
    eventBus.on('CROSSHAIR_MOVE', mockHandler);
    eventBus.off('CROSSHAIR_MOVE', mockHandler);
    
    eventBus.emit('CROSSHAIR_MOVE', { timestamp: 123, price: 100 });
    
    expect(mockHandler).not.toHaveBeenCalled();
  });
});