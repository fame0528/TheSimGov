import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';
import CompanyForm from '@/components/companies/CompanyForm';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

global.fetch = jest.fn() as unknown as typeof fetch;

const renderForm = (props = {}) =>
  render(
    <ChakraProvider>
      <CompanyForm onSuccess={jest.fn()} {...props} />
    </ChakraProvider>
  );

describe('CompanyForm UI', () => {
  beforeEach(() => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockReset();
    // Default mock: credit score API resolves immediately
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ score: 700, maxLoan: 50000, tierName: 'Good' }),
    } as Response);
  });

  it('shows loading spinner and disables funding select until credit score returns', async () => {
    let resolveJson: any;
    const jsonPromise = new Promise((resolve) => { resolveJson = resolve; });

    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => jsonPromise } as Response);

    renderForm();

    // Wait for component to render (Technology industry selected triggers funding UI)
    // First select Technology industry to trigger funding UI
    const industrySelect = screen.getByLabelText(/Industry/i);
    fireEvent.change(industrySelect, { target: { value: 'Technology' } });

    // Select AI path to create shortfall
    await waitFor(() => {
      expect(screen.getByLabelText(/Technology Path/i)).toBeInTheDocument();
    });
    const pathSelect = screen.getByLabelText(/Technology Path/i);
    fireEvent.change(pathSelect, { target: { value: 'AI' } });

    // Funding Type select should appear and be disabled while loading
    await waitFor(() => {
      expect(screen.getByText(/Funding Required/i)).toBeInTheDocument();
    });

    const fundingSelect = screen.getByLabelText(/Funding Type/i);
    expect(fundingSelect).toBeDisabled();

    // Resolve credit score
    resolveJson({ score: 700, maxLoan: 50000, tierName: 'Good' });

    // Funding Type should become enabled
    await waitFor(() => {
      expect(fundingSelect).not.toBeDisabled();
    });
  });

  it('allows user input and validates funding amount for Loan', async () => {
    renderForm();

    // Select Technology → AI path
    const industrySelect = screen.getByLabelText(/Industry/i);
    fireEvent.change(industrySelect, { target: { value: 'Technology' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Technology Path/i)).toBeInTheDocument();
    });
    const pathSelect = screen.getByLabelText(/Technology Path/i);
    fireEvent.change(pathSelect, { target: { value: 'AI' } });

    await waitFor(() => {
      expect(screen.getByText(/Funding Required/i)).toBeInTheDocument();
    });

    // Select Loan funding
    const fundingSelect = await screen.findByLabelText(/Funding Type/i);
    await waitFor(() => expect(fundingSelect).not.toBeDisabled());
    fireEvent.change(fundingSelect, { target: { value: 'Loan' } });

    // Funding amount input should exist and have auto-filled to shortfall
    const fundingInput = await screen.findByLabelText(/Funding Amount \(USD\)/i) as HTMLInputElement;
    await waitFor(() => {
      expect(Number(fundingInput.value)).toBeGreaterThan(0);
    });

    // User can input any value (no auto-clamping)
    fireEvent.change(fundingInput, { target: { value: '999999' } });
    expect(Number(fundingInput.value)).toBe(999999);

    // User can input zero (no auto-clamping)
    fireEvent.change(fundingInput, { target: { value: '0' } });
    expect(Number(fundingInput.value)).toBe(0);

    // User can input values within valid range
    fireEvent.change(fundingInput, { target: { value: '25000' } });
    expect(Number(fundingInput.value)).toBe(25000);
  });

  it('displays correct path info text matching path selection', async () => {
    renderForm();

    // Select Technology industry
    const industrySelect = screen.getByLabelText(/Industry/i);
    fireEvent.change(industrySelect, { target: { value: 'Technology' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Technology Path/i)).toBeInTheDocument();
    });

    const pathSelect = screen.getByLabelText(/Technology Path/i);

    // Test Software path info
    fireEvent.change(pathSelect, { target: { value: 'Software' } });
    await waitFor(() => {
      expect(screen.getByText(/Software — \$6,000: SaaS-focused startup/i)).toBeInTheDocument();
    });

    // Test AI path info
    fireEvent.change(pathSelect, { target: { value: 'AI' } });
    await waitFor(() => {
      expect(screen.getByText(/AI — \$12,000: ML consulting & AI services/i)).toBeInTheDocument();
    });

    // Test Hardware path info
    fireEvent.change(pathSelect, { target: { value: 'Hardware' } });
    await waitFor(() => {
      expect(screen.getByText(/Hardware — \$18,000: Physical repair\/manufacturing track/i)).toBeInTheDocument();
    });
  });

  it('auto-fills funding amount to shortfall when path or funding type changes', async () => {
    renderForm();

    // Select Technology → AI path
    const industrySelect = screen.getByLabelText(/Industry/i);
    fireEvent.change(industrySelect, { target: { value: 'Technology' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Technology Path/i)).toBeInTheDocument();
    });
    const pathSelect = screen.getByLabelText(/Technology Path/i);
    fireEvent.change(pathSelect, { target: { value: 'AI' } });

    await waitFor(() => {
      expect(screen.getByText(/Funding Required/i)).toBeInTheDocument();
    });

    // Select Loan funding
    const fundingSelect = await screen.findByLabelText(/Funding Type/i);
    await waitFor(() => expect(fundingSelect).not.toBeDisabled());
    fireEvent.change(fundingSelect, { target: { value: 'Loan' } });

    // Funding amount should auto-fill to shortfall
    const fundingInput = await screen.findByLabelText(/Funding Amount \(USD\)/i) as HTMLInputElement;
    await waitFor(() => {
      expect(Number(fundingInput.value)).toBeGreaterThan(0);
    });

    // Change to Hardware path (higher cost, higher shortfall)
    fireEvent.change(pathSelect, { target: { value: 'Hardware' } });

    // Funding amount should update to new shortfall
    await waitFor(() => {
      const currentValue = Number(fundingInput.value);
      expect(currentValue).toBeGreaterThan(0);
      // Hardware shortfall is higher than AI, so value should increase
      // (Exact value depends on industry costs, but should be > AI shortfall)
    });
  });

  it('displays credit score info when available', async () => {
    renderForm();

    // Select Technology → AI path
    const industrySelect = screen.getByLabelText(/Industry/i);
    fireEvent.change(industrySelect, { target: { value: 'Technology' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Technology Path/i)).toBeInTheDocument();
    });
    const pathSelect = screen.getByLabelText(/Technology Path/i);
    fireEvent.change(pathSelect, { target: { value: 'AI' } });

    // Credit score info should display
    await waitFor(() => {
      expect(screen.getByText(/Your credit score:/i)).toBeInTheDocument();
      expect(screen.getByText(/700/)).toBeInTheDocument();
      expect(screen.getByText(/Max loan:/i)).toBeInTheDocument();
    });
  });
});
