/**
 * @file components/companies/CompanyForm.tsx
 * @description Company creation form with industry selection and mission statement
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Client component for creating new companies. Provides industry selection dropdown
 * with descriptions, company name input, and optional mission statement textarea.
 * Validates input client-side with Zod, displays industry tooltips, and handles
 * API submission with error handling.
 * 
 * FEATURES:
 * - Industry selection with risk/reward tooltips
 * - Real-time client-side validation
 * - Loading states during submission
 * - Error message display
 * - Success callback on company creation
 * 
 * USAGE:
 * ```typescript
 * import CompanyForm from '@/components/companies/CompanyForm';
 * 
 * <CompanyForm onSuccess={(company) => {
 *   console.log('Company created:', company);
 *   router.push(`/companies/${company._id}`);
 * }} />
 * ```
 * 
 * IMPLEMENTATION NOTES:
 * - Uses Chakra UI components for consistent styling
 * - Integrates with custom color palette (picton_blue, gold, red_cmyk)
 * - Client-side validation matches server-side Zod schema
 * - Displays industry info tooltips on hover
 * - Clears form on successful submission
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  FormErrorMessage,
  useToast,
  Text,
  HStack,
  Tooltip,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { createCompanySchema, CreateCompanyInput } from '@/lib/validations/company';
import { INDUSTRY_INFO, IndustryType } from '@/lib/constants/industries';
import type { ICompany } from '@/lib/db/models/Company';
import { SEED_CAPITAL, TECH_PATH_COSTS, LOAN_SHORTFALL_MULTIPLIER, DEFAULT_LOAN_TERMS } from '@/lib/constants/funding';
import type { FundingPayload } from '@/types/company';

/**
 * CompanyForm props interface
 * 
 * @interface CompanyFormProps
 * @property {function} onSuccess - Callback fired when company created successfully
 */
interface CompanyFormProps {
  onSuccess: (company: ICompany) => void;
}

/**
 * CompanyForm component
 * 
 * @description
 * Form for creating new companies with validation and error handling.
 * 
 * @param {CompanyFormProps} props - Component props
 * @returns {JSX.Element} Rendered company creation form
 * 
 * @example
 * ```tsx
 * <CompanyForm onSuccess={(company) => {
 *   router.push(`/companies/${company._id}`);
 * }} />
 * ```
 */
export default function CompanyForm({ onSuccess }: CompanyFormProps) {
  const toast = useToast();
  
  // Form state
  const [formData, setFormData] = useState<CreateCompanyInput>({
    name: '',
    industry: 'Construction',
    mission: '',
    techPath: undefined,
  });
  
  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCompanyInput, string>>>({});
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Funding state (required for Technology if remaining capital < 0)
  const [fundingType, setFundingType] = useState<'Loan' | 'Accelerator' | 'Angel' | ''>('');
  const [fundingAmount, setFundingAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(5);
  const [termMonths, setTermMonths] = useState<number>(24);
  // Credit score info from server
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [maxLoanAllowed, setMaxLoanAllowed] = useState<number | null>(null);
  const [creditTierName, setCreditTierName] = useState<string | null>(null);
  const [isCreditLoading, setIsCreditLoading] = useState(true);

  // Derived values
  const selectedPathCost = useMemo(() => {
    return formData.industry === 'Technology' && (formData as any).techPath
      ? TECH_PATH_COSTS[(formData as any).techPath as keyof typeof TECH_PATH_COSTS]
      : 0;
  }, [formData.industry, (formData as any).techPath]);

  const totalStartupCost = useMemo(() => {
    const industry = INDUSTRY_INFO[formData.industry];
    return industry.startupCost + industry.equipmentCost + industry.licensingCost + (selectedPathCost || 0);
  }, [formData.industry, selectedPathCost]);

  const baseIndustryCost = useMemo(() => {
    const industry = INDUSTRY_INFO[formData.industry];
    return industry.startupCost + industry.equipmentCost + industry.licensingCost;
  }, [formData.industry]);

  const remainingAfterStartup = useMemo(() => SEED_CAPITAL - totalStartupCost, [totalStartupCost]);

  const shortfall = Math.max(0, -remainingAfterStartup);
  const allowedLoanCap = useMemo(() => {
    if (!maxLoanAllowed) return null;
    return Math.min(maxLoanAllowed, shortfall * LOAN_SHORTFALL_MULTIPLIER);
  }, [maxLoanAllowed, shortfall]);

  // Auto-fill funding amount when shortfall or funding type changes
  useEffect(() => {
    if (shortfall <= 0) return;
    const defaultAmount = shortfall;
    if (fundingAmount <= 0) {
      // initial fill
      const max = fundingType === 'Loan' ? (allowedLoanCap ?? defaultAmount) : defaultAmount;
      setFundingAmount(Math.min(defaultAmount, max));
      return;
    }

    // Clamp existing funding to allowed range
    const max = fundingType === 'Loan' ? (allowedLoanCap ?? Infinity) : (maxLoanAllowed ?? 2_000_000);
    if (fundingAmount < defaultAmount) {
      setFundingAmount(defaultAmount);
    } else if (fundingAmount > max) {
      setFundingAmount(max);
    }
  }, [shortfall, fundingType, allowedLoanCap]);

  /**
   * Handle input changes
   * Clears validation error for the changed field
   */
  const handleChange = (
    field: keyof CreateCompanyInput,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /**
   * Validate form data with Zod schema
   * 
   * @returns {boolean} True if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const result = createCompanySchema.safeParse(formData);
    
    if (!result.success) {
      // Extract field errors from Zod
      const fieldErrors: Partial<Record<keyof CreateCompanyInput, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof CreateCompanyInput;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  /**
   * Handle form submission
   * Validates form, calls API, and handles response
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call company creation API
      const body: any = { ...formData };
      const remaining =
        SEED_CAPITAL -
        INDUSTRY_INFO[formData.industry].startupCost -
        INDUSTRY_INFO[formData.industry].equipmentCost -
        INDUSTRY_INFO[formData.industry].licensingCost;

      if (formData.industry === 'Technology') {
        // Add tech path cost to remaining calculation (if selected)
        const selectedPathCost = (formData as any).techPath ? TECH_PATH_COSTS[(formData as any).techPath as keyof typeof TECH_PATH_COSTS] : 0;
        const remainingWithPath = remaining - selectedPathCost;
        if (remainingWithPath < 0) {
          if (!fundingType || fundingAmount <= 0) {
            toast({
              title: 'Funding required',
              description: 'Select a funding type and amount to cover startup shortfall.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            setIsSubmitting(false);
            return;
          }
          body.techPath = (formData as any).techPath || undefined;
          // Attach funding payload so server can handle loan/investment
          body.funding = {
            type: fundingType,
            amount: Number(fundingAmount),
            interestRate: fundingType === 'Loan' ? Number(interestRate || DEFAULT_LOAN_TERMS.interestRate) : undefined,
            termMonths: fundingType === 'Loan' ? Number(termMonths || DEFAULT_LOAN_TERMS.termMonths) : undefined,
          } as FundingPayload;
        }
      }

      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Display backend validation error details if available
        let errorMessage = data.error || 'Failed to create company';
        if (data.details) {
          const { allowedCap, shortfall, userMaxLoan } = data.details;
          errorMessage += ` (Shortfall: $${shortfall?.toLocaleString()}, Allowed Cap: $${allowedCap?.toLocaleString()}, Max Loan: $${userMaxLoan?.toLocaleString()})`;
        }
        throw new Error(errorMessage);
      }
      
      // Success
      toast({
        title: 'Company Created',
        description: `${data.company.name} has been successfully founded!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setFormData({
        name: '',
        industry: 'Construction',
        mission: '',
        techPath: undefined,
      });
      setFundingType('');
      setFundingAmount(0);
      setInterestRate(5);
      setTermMonths(24);
      
      // Call success callback
      onSuccess(data.company);
    } catch (error) {
      console.error('Company creation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create company',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch minimal credit score info for logged-in user to show loan cap
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsCreditLoading(true);
        const res = await fetch('/api/credit-score');
        if (!res.ok) {
          if (mounted) {
            toast({
              title: 'Credit Score Unavailable',
              description: 'Unable to fetch credit information. Default loan limits will apply.',
              status: 'warning',
              duration: 4000,
              isClosable: true,
            });
          }
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setCreditScore(data.score ?? null);
        setMaxLoanAllowed(data.maxLoan ?? null);
        setCreditTierName(data.tierName ?? null);
      } catch (err) {
        if (mounted) {
          toast({
            title: 'Network Error',
            description: 'Failed to load credit score. Please check your connection.',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
        }
      } finally {
        if (mounted) setIsCreditLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg="night.400"
      borderRadius="2xl"
      border="1px solid"
      borderColor="ash_gray.800"
      p={6}
    >
      <VStack spacing={5} align="stretch">
        {/* Company Name */}
        <FormControl isInvalid={!!errors.name} isRequired>
          <FormLabel color="white">Company Name</FormLabel>
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter company name (3-50 characters)"
            bg="night.300"
            borderColor="ash_gray.700"
            color="white"
            _placeholder={{ color: 'ash_gray.600' }}
            _hover={{ borderColor: 'ash_gray.600' }}
            _focus={{ borderColor: 'picton_blue.500', boxShadow: '0 0 0 1px #00aef3' }}
          />
          <FormErrorMessage color="red_cmyk.500">{errors.name}</FormErrorMessage>
        </FormControl>

        {/* Industry Selection */}
        <FormControl isInvalid={!!errors.industry} isRequired>
          <HStack spacing={2} mb={2}>
            <FormLabel color="white" mb={0}>Industry</FormLabel>
            <Tooltip
              label="Each industry has unique gameplay mechanics and risk/reward profiles"
              placement="top"
              hasArrow
            >
              <InfoIcon color="picton_blue.500" boxSize={4} />
            </Tooltip>
          </HStack>
          <Select
            value={formData.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
            bg="night.300"
            borderColor="ash_gray.700"
            color="white"
            _hover={{ borderColor: 'ash_gray.600' }}
            _focus={{ borderColor: 'picton_blue.500', boxShadow: '0 0 0 1px #00aef3' }}
          >
            {Object.entries(INDUSTRY_INFO).map(([industry, info]) => {
              const totalCost = info.startupCost + info.equipmentCost + info.licensingCost;
              return (
                <option key={industry} value={industry} style={{ backgroundColor: '#1a1a1a' }}>
                  {industry} - {info.risk} Risk, {info.reward} Reward — ${totalCost.toLocaleString()}
                </option>
              );
            })}
          </Select>
          <FormErrorMessage color="red_cmyk.500">{errors.industry}</FormErrorMessage>
          
          {/* Industry Description */}
          {formData.industry && (
            <Box mt={3} p={3} bg="night.300" borderRadius="md" borderColor="ash_gray.700" border="1px solid">
              <Text color="ash_gray.400" fontSize="sm">
                <strong style={{ color: '#ffd700' }}>{formData.industry}:</strong>{' '}
                {INDUSTRY_INFO[formData.industry as IndustryType].description}
              </Text>
              <Text color="ash_gray.400" fontSize="xs" mt={2}>
                Total industry cost (startup + equipment + licensing): <strong style={{ color: '#ffd700' }}>${baseIndustryCost.toLocaleString()}</strong>
              </Text>
            </Box>
          )}

          {/* Technology path selection (Software | AI | Hardware) */}
          {formData.industry === 'Technology' && (
            <Box mt={3} p={3} bg="night.300" borderRadius="md" borderColor="ash_gray.700" border="1px solid">
              <FormControl>
                <FormLabel color="white">Technology Path</FormLabel>
                <Select
                  value={(formData as any).techPath ?? ''}
                  onChange={(e) => handleChange('techPath' as any, e.target.value)}
                  bg="night.300"
                  borderColor="ash_gray.700"
                  color="white"
                >
                  <option value="">Select a path</option>
                  <option value="Software">Software — ${TECH_PATH_COSTS.Software.toLocaleString()}</option>
                  <option value="AI">AI — ${TECH_PATH_COSTS.AI.toLocaleString()}</option>
                  <option value="Hardware">Hardware — ${TECH_PATH_COSTS.Hardware.toLocaleString()}</option>
                </Select>
                    {!(formData as any).techPath && (
                      <Box mt={2} p={3} bg="night.300" borderRadius="md" border="1px solid" borderColor="ash_gray.700">
                        <Text color="ash_gray.500" fontSize="sm" fontStyle="italic">
                          Please select a technology path to see details and calculate startup costs.
                        </Text>
                      </Box>
                    )}
                    {selectedPathCost > 0 && (
                      <Box mt={2} p={3} bg="night.300" borderRadius="md" border="1px solid" borderColor="ash_gray.700">
                        <Text color="ash_gray.400" fontSize="sm" mb={2}>
                          { (formData as any).techPath === 'Software' && 'Software — $6,000: SaaS-focused startup with a lean operational footprint, recurring revenue via subscription models.' }
                          { (formData as any).techPath === 'AI' && 'AI — $12,000: ML consulting & AI services requiring model training budget, data costs, and compute.' }
                          { (formData as any).techPath === 'Hardware' && 'Hardware — $18,000: Physical repair/manufacturing track with higher equipment & inventory costs.' }
                        </Text>
                        <Text color="ash_gray.500" fontSize="xs">Path cost: ${selectedPathCost.toLocaleString()}</Text>
                      </Box>
                    )}
              </FormControl>
            </Box>
          )}
        </FormControl>

        {/* Funding section for Technology (AI) when remaining capital is negative */}
        {formData.industry === 'Technology' && (
          (() => {
            const remaining =
              10000 -
              INDUSTRY_INFO[formData.industry].startupCost -
              INDUSTRY_INFO[formData.industry].equipmentCost -
              INDUSTRY_INFO[formData.industry].licensingCost;
            const pathCostMap: Record<string, number> = { Software: 6000, AI: 12000, Hardware: 18000 };
            const selectedPathCost = (formData as any).techPath ? pathCostMap[(formData as any).techPath] : 0;
            const remainingWithPath = remaining - selectedPathCost;
            if (remainingWithPath < 0) {
              return (
                <Box p={4} bg="night.300" borderRadius="md" borderColor="red_cmyk.500" border="1px solid">
                    <Text color="red_cmyk.500" fontWeight="bold" mb={2}>
                    Funding Required: Shortfall ${shortfall.toLocaleString()}
                  </Text>
                  {creditScore !== null && (
                    <Text color="ash_gray.400" fontSize="sm" mb={2}>
                      Your credit score: <strong style={{ color: '#ffd700' }}>{creditScore}</strong>
                      {creditTierName && (
                        <span> ({creditTierName})</span>
                      )}
                      {maxLoanAllowed ? (
                        <span> — Max loan: ${maxLoanAllowed.toLocaleString()}</span>
                      ) : null}
                    </Text>
                  )}
                  {/** Show allowed cap for loans if Loan selected */}
                  {fundingType === 'Loan' && allowedLoanCap !== null && (
                    <Text color="ash_gray.400" fontSize="sm" mb={2}>
                      Loan cap for this request: <strong style={{ color: '#ffd700' }}>${allowedLoanCap.toLocaleString()}</strong>
                    </Text>
                  )}
                  <VStack align="stretch" spacing={3}>
                    <FormControl isRequired>
                      <HStack justify="space-between">
                        <FormLabel color="white">Funding Type</FormLabel>
                        {isCreditLoading && <Spinner size="sm" color="picton_blue.500" />}
                      </HStack>
                      <Select
                        value={fundingType}
                        onChange={(e) => setFundingType(e.target.value as any)}
                        bg="night.300"
                        borderColor="ash_gray.700"
                        color="white"
                        isDisabled={isCreditLoading}
                      >
                        <option value="" style={{ backgroundColor: '#1a1a1a' }}>Select</option>
                        <option value="Loan" style={{ backgroundColor: '#1a1a1a' }}>Loan (5% default, 24 months)</option>
                        <option value="Accelerator" style={{ backgroundColor: '#1a1a1a' }}>Accelerator (non-debt funding)</option>
                        <option value="Angel" style={{ backgroundColor: '#1a1a1a' }}>Angel Investment</option>
                      </Select>
                    </FormControl>
                    {fundingType && (
                      <Box mt={2} p={3} bg="night.300" borderRadius="md" border="1px solid" borderColor="ash_gray.700">
                        {fundingType === 'Loan' && (
                          <Text color="ash_gray.400" fontSize="sm">
                            <strong style={{ color: '#ffd700' }}>Loan:</strong>{' '}
                            Borrow cash from a bank at a fixed interest rate. You receive the funds now but
                            must make monthly payments over {termMonths} months. Missing payments will hurt your
                            credit score and reduce future borrowing power.
                          </Text>
                        )}
                        {fundingType === 'Accelerator' && (
                          <Text color="ash_gray.400" fontSize="sm">
                            <strong style={{ color: '#ffd700' }}>Accelerator:</strong>{' '}
                            Non-debt funding in exchange for equity and mentorship. You do not make
                            monthly payments, but you permanently give up a portion of ownership and future profits.
                          </Text>
                        )}
                        {fundingType === 'Angel' && (
                          <Text color="ash_gray.400" fontSize="sm">
                            <strong style={{ color: '#ffd700' }}>Angel Investment:</strong>{' '}
                            High-risk early investment from a wealthy individual. You receive cash without fixed
                            repayments, but your investor expects high growth and a meaningful equity stake.
                          </Text>
                        )}
                      </Box>
                    )}
                    <FormControl isRequired isInvalid={fundingType === 'Loan' && allowedLoanCap !== null && fundingAmount > allowedLoanCap}>
                      <FormLabel color="white">Funding Amount (USD)</FormLabel>
                      <Input
                        type="number"
                        value={fundingAmount}
                        onChange={(e) => {
                          const raw = Number(e.target.value) || 0;
                          setFundingAmount(raw);
                          
                          // Real-time validation feedback
                          if (raw < shortfall) {
                            toast({
                              title: 'Insufficient Funding',
                              description: `Amount must cover shortfall of $${shortfall.toLocaleString()}`,
                              status: 'warning',
                              duration: 2000,
                              isClosable: true,
                            });
                          }
                          
                          const max = fundingType === 'Loan' ? (allowedLoanCap ?? Infinity) : (maxLoanAllowed ?? 2_000_000);
                          if (raw > max && fundingType === 'Loan') {
                            toast({
                              title: 'Exceeds Loan Cap',
                              description: `Maximum allowed: $${max.toLocaleString()}`,
                              status: 'error',
                              duration: 2000,
                              isClosable: true,
                            });
                          }
                        }}
                        bg="night.300"
                        borderColor="ash_gray.700"
                        color="white"
                        min={shortfall}
                        max={fundingType === 'Loan' ? (allowedLoanCap ?? undefined) : (maxLoanAllowed ?? undefined)}
                      />
                      <FormErrorMessage color="red_cmyk.500">
                        Requested amount exceeds your allowed loan cap (${(allowedLoanCap || 0).toLocaleString()})
                      </FormErrorMessage>
                    </FormControl>
                    {fundingType === 'Loan' && (
                      <HStack spacing={4}>
                        <FormControl>
                          <FormLabel color="white">Interest Rate (%)</FormLabel>
                          <Input
                            type="number"
                            value={interestRate}
                            onChange={(e) => setInterestRate(Number(e.target.value))}
                            bg="night.300"
                            borderColor="ash_gray.700"
                            color="white"
                            min={0.1}
                            max={50}
                            step={0.1}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel color="white">Term (months)</FormLabel>
                          <Input
                            type="number"
                            value={termMonths}
                            onChange={(e) => setTermMonths(Number(e.target.value))}
                            bg="night.300"
                            borderColor="ash_gray.700"
                            color="white"
                            min={3}
                            max={360}
                          />
                        </FormControl>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              );
            }
            return null;
          })()
        )}

        {/* Mission Statement */}
        <FormControl isInvalid={!!errors.mission}>
          <HStack spacing={2} mb={2}>
            <FormLabel color="white" mb={0}>Mission Statement (Optional)</FormLabel>
            <Tooltip
              label="Define your company's purpose and values (max 500 characters)"
              placement="top"
              hasArrow
            >
              <InfoIcon color="picton_blue.500" boxSize={4} />
            </Tooltip>
          </HStack>
          <Textarea
            value={formData.mission}
            onChange={(e) => handleChange('mission', e.target.value)}
            placeholder="What does your company stand for?"
            rows={4}
            bg="night.300"
            borderColor="ash_gray.700"
            color="white"
            _placeholder={{ color: 'ash_gray.600' }}
            _hover={{ borderColor: 'ash_gray.600' }}
            _focus={{ borderColor: 'picton_blue.500', boxShadow: '0 0 0 1px #00aef3' }}
            resize="vertical"
          />
          <FormErrorMessage color="red_cmyk.500">{errors.mission}</FormErrorMessage>
          {formData.mission && (
            <Text color="ash_gray.600" fontSize="xs" mt={1}>
              {formData.mission.length} / 500 characters
            </Text>
          )}
        </FormControl>

        {/* Startup Cost Info */}
        {formData.industry && (
          <Box p={4} bg="night.300" borderRadius="md" borderColor="gold.500" border="1px solid">
            <HStack spacing={2} mb={3}>
              <Icon viewBox="0 0 20 20" boxSize={5} color="gold.500">
                <path
                  fill="currentColor"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                />
              </Icon>
              <Text color="gold.500" fontWeight="bold">
                Starting Capital: ${SEED_CAPITAL.toLocaleString()}
              </Text>
            </HStack>
            <VStack align="stretch" spacing={2}>
              <Text color="white" fontSize="sm" fontWeight="medium">
                Startup Costs:
              </Text>
              <HStack justify="space-between" pl={4}>
                <Text color="ash_gray.400" fontSize="sm">Office, insurance, setup</Text>
                <Text color="red_cmyk.500" fontSize="sm" fontWeight="bold">
                  -${INDUSTRY_INFO[formData.industry].startupCost.toLocaleString()}
                </Text>
              </HStack>
              <HStack justify="space-between" pl={4}>
                <Text color="ash_gray.400" fontSize="sm">Equipment & tools</Text>
                <Text color="red_cmyk.500" fontSize="sm" fontWeight="bold">
                  -${INDUSTRY_INFO[formData.industry].equipmentCost.toLocaleString()}
                </Text>
              </HStack>
              <HStack justify="space-between" pl={4}>
                <Text color="ash_gray.400" fontSize="sm">Licensing & permits</Text>
                <Text color="red_cmyk.500" fontSize="sm" fontWeight="bold">
                  -${INDUSTRY_INFO[formData.industry].licensingCost.toLocaleString()}
                </Text>
              </HStack>
              <Box borderTop="1px solid" borderColor="ash_gray.700" pt={2} mt={2}>
                <HStack justify="space-between">
                  <Text color="white" fontSize="md" fontWeight="bold">
                    Remaining Capital:
                  </Text>
                  <Text color="gold.500" fontSize="md" fontWeight="bold">
                    ${(remainingAfterStartup + (fundingAmount || 0)).toLocaleString()}
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </Box>
        )}

        {/* Seed Capital Info (fallback if no industry selected) */}
        {!formData.industry && (
          <Box p={4} bg="night.300" borderRadius="md" borderColor="gold.500" border="1px solid">
            <HStack spacing={2} mb={2}>
              <Icon viewBox="0 0 20 20" boxSize={5} color="gold.500">
                <path
                  fill="currentColor"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                />
              </Icon>
              <Text color="gold.500" fontWeight="bold">
                Starting Capital: ${SEED_CAPITAL.toLocaleString()}
              </Text>
            </HStack>
            <Text color="ash_gray.400" fontSize="sm">
              Select an industry to see startup cost breakdown. Each industry has different initial costs for office setup, equipment, and licensing.
            </Text>
          </Box>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText="Creating Company..."
          bg="picton_blue.500"
          color="white"
          size="lg"
          _hover={{ bg: 'picton_blue.600' }}
          _active={{ bg: 'picton_blue.700' }}
          isDisabled={!formData.name || !formData.industry}
        >
          Found Company
        </Button>
      </VStack>
    </Box>
  );
}
