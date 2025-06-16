/**
 * Integration test hitting live Pikud ha-oref endpoints (optional).
 *
 * Set environment variable LIVE_TEST=true to enable.
 * The test is skipped by default so CI can run offline.
 */
import { RedAlertAPI } from '../../src/red-alert-api';

const runLive = process.env.LIVE_TEST === 'true';

(runLive ? describe : describe.skip)('Integration: Live RedAlertAPI', () => {
  const api = new RedAlertAPI();

  afterAll(() => {
    api.close();
  });

  it('should fetch current alerts without throwing', async () => {
    await expect(api.getCurrentAlerts()).resolves.not.toThrow();
  });

  it('should fetch alert history (<=5 items)', async () => {
    const history = await api.getAlertHistory(5);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeLessThanOrEqual(5);
  });
}); 