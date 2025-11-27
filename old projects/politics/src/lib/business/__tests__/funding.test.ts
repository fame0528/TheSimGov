import { validateFunding } from '@/lib/business/funding';

describe('Funding validation', () => {
  it('rejects when funding missing and shortfall > 0', () => {
    const res = validateFunding({ funding: undefined, shortfall: 1000, userMaxLoan: 50000 });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Funding required/i);
  });

  it('rejects non-positive funding amounts', () => {
    const res = validateFunding({ funding: { type: 'Loan', amount: 0 }, shortfall: 1000, userMaxLoan: 50000 });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/positive number/i);
  });

  it('rejects funding below shortfall', () => {
    const res = validateFunding({ funding: { type: 'Loan', amount: 500 }, shortfall: 1000, userMaxLoan: 50000 });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/cover startup shortfall/i);
    expect(res.allowedCap).toBeGreaterThan(0);
  });

  it('rejects if request is above allowed cap (credit-limited)', () => {
    const userMax = 20000; // small allowed loan
    const res = validateFunding({ funding: { type: 'Accelerator', amount: 50000 }, shortfall: 1000, userMaxLoan: userMax });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/exceeds your allowable cap/i);
    expect(res.allowedCap).toBeGreaterThan(0);
    expect(res.allowedCap).toBeLessThan(50000);
  });

  it('accepts valid funding within shortfall and cap', () => {
    const res = validateFunding({ funding: { type: 'Loan', amount: 2000 }, shortfall: 1000, userMaxLoan: 50000 });
    expect(res.valid).toBe(true);
    expect(res.allowedCap).toBeGreaterThanOrEqual(2000);
  });
});
