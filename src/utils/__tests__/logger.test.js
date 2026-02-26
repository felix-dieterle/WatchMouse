import { logger, LOG_LEVELS } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    logger.clear();
  });

  describe('info/warn/error', () => {
    it('should add an info entry', () => {
      logger.info('hello info');
      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LOG_LEVELS.INFO);
      expect(entries[0].message).toBe('hello info');
    });

    it('should add a warn entry', () => {
      logger.warn('hello warn');
      const entries = logger.getEntries();
      expect(entries[0].level).toBe(LOG_LEVELS.WARN);
      expect(entries[0].message).toBe('hello warn');
    });

    it('should add an error entry', () => {
      logger.error('hello error');
      const entries = logger.getEntries();
      expect(entries[0].level).toBe(LOG_LEVELS.ERROR);
      expect(entries[0].message).toBe('hello error');
    });

    it('should store entries newest-first', () => {
      logger.info('first');
      logger.info('second');
      const entries = logger.getEntries();
      expect(entries[0].message).toBe('second');
      expect(entries[1].message).toBe('first');
    });

    it('should include a timestamp on each entry', () => {
      logger.info('timestamped');
      const entry = logger.getEntries()[0];
      expect(entry.timestamp).toBeDefined();
      expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
    });

    it('should include a unique id on each entry', () => {
      logger.info('a');
      logger.info('b');
      const [b, a] = logger.getEntries();
      expect(a.id).toBeDefined();
      expect(b.id).toBeDefined();
      expect(a.id).not.toBe(b.id);
    });

    it('should coerce non-string values to string', () => {
      logger.info(42);
      expect(logger.getEntries()[0].message).toBe('42');
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      logger.info('a');
      logger.warn('b');
      logger.clear();
      expect(logger.getEntries()).toHaveLength(0);
    });
  });

  describe('getEntries', () => {
    it('should return a copy so mutations do not affect internal state', () => {
      logger.info('original');
      const copy = logger.getEntries();
      copy.splice(0, 1);
      expect(logger.getEntries()).toHaveLength(1);
    });
  });

  describe('subscribe', () => {
    it('should notify listener on new entry', () => {
      const listener = jest.fn();
      const unsubscribe = logger.subscribe(listener);
      logger.info('notify me');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0][0].message).toBe('notify me');
      unsubscribe();
    });

    it('should notify listener on clear', () => {
      logger.info('a');
      const listener = jest.fn();
      const unsubscribe = logger.subscribe(listener);
      logger.clear();
      expect(listener).toHaveBeenCalledWith([]);
      unsubscribe();
    });

    it('should stop notifying after unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = logger.subscribe(listener);
      unsubscribe();
      logger.info('after unsub');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('MAX_LOG_ENTRIES', () => {
    it('should cap entries at 200', () => {
      for (let i = 0; i < 210; i++) {
        logger.info(`entry ${i}`);
      }
      expect(logger.getEntries().length).toBe(200);
    });
  });
});
