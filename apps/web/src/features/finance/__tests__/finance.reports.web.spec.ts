import { describe, it, expect, vi } from 'vitest';
import { financeApi } from '../finance.api';

describe('Web Financial Reports API & CSV Export Tests', () => {
  it('getReports periodId ve year parametrelerini doğru URL ile çağırmalıdır', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { siteName: 'Test Sitesi' } }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    await financeApi.getReports('group-1', 'period-august-2026', 2026);

    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl).toContain('/api/finance/reports');
    expect(calledUrl).toContain('periodId=period-august-2026');
    expect(calledUrl).toContain('year=2026');

    vi.unstubAllGlobals();
  });
});
