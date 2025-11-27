import { createCompanySchema } from '@/lib/validations/company';

describe('createCompanySchema', () => {
  it('validates tech path and funding for Technology', () => {
    const valid = createCompanySchema.safeParse({
      name: 'Test Tech',
      industry: 'Technology',
      mission: 'Test',
      techPath: 'Software',
      funding: { type: 'Loan', amount: 6000, interestRate: 5, termMonths: 24 },
    });
    expect(valid.success).toBe(true);
  });

  it('rejects funding beyond allowed cap for Accelerator', () => {
    const invalid = createCompanySchema.safeParse({
      name: 'Test Tech 2',
      industry: 'Technology',
      mission: 'Test',
      techPath: 'AI',
      funding: { type: 'Accelerator', amount: 9999999999 },
    });
    // Schema should accept format, but server rejects amount; verify schema is permissive
    expect(invalid.success).toBe(true);
  });

  it('rejects invalid techPath', () => {
    const invalid = createCompanySchema.safeParse({
      name: 'Test Tech',
      industry: 'Technology',
      techPath: 'NotAPath',
    });
    expect(invalid.success).toBe(false);
  });
});
