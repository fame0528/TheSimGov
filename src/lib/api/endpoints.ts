/**
 * @fileoverview Typed API Endpoint Definitions
 * @module lib/api/endpoints
 * 
 * OVERVIEW:
 * Single source of truth for all API endpoints. Provides type-safe path
 * generation and prevents magic strings scattered across components.
 * Prevents duplicate endpoint definitions from legacy build.
 * 
 * @created 2025-11-20
 * @author ECHO v1.1.0
 */

/**
 * Authentication endpoints
 */
export const authEndpoints = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  session: '/api/auth/session',
  refresh: '/api/auth/refresh',
} as const;

/**
 * Company endpoints with dynamic path generation
 */
export const companyEndpoints = {
  list: '/api/companies',
  create: '/api/companies',
  byId: (id: string) => `/api/companies/${id}` as const,
  update: (id: string) => `/api/companies/${id}` as const,
  delete: (id: string) => `/api/companies/${id}` as const,
  employees: (id: string) => `/api/companies/${id}/employees` as const,
  financials: (id: string) => `/api/companies/${id}/financials` as const,
  levelUp: (id: string) => `/api/companies/${id}/level-up` as const,
  checkName: (name: string) => `/api/companies/check-name?name=${encodeURIComponent(name)}` as const,
} as const;

/**
 * Employee endpoints
 */
export const employeeEndpoints = {
  list: '/api/employees',
  hire: '/api/employees',
  marketplace: '/api/employees/marketplace',
  byId: (id: string) => `/api/employees/${id}` as const,
  fire: (id: string) => `/api/employees/${id}` as const,
  train: (id: string) => `/api/employees/${id}/train` as const,
  review: (id: string) => `/api/employees/${id}/review` as const,
  promote: (id: string) => `/api/employees/${id}/promote` as const,
} as const;

/**
 * Contract endpoints
 */
export const contractEndpoints = {
  marketplace: '/api/contracts/marketplace',
  active: '/api/contracts/active',
  create: '/api/contracts',
  byId: (id: string) => `/api/contracts/${id}` as const,
  bid: (id: string) => `/api/contracts/${id}/bid` as const,
  accept: (id: string) => `/api/contracts/${id}/accept` as const,
  complete: (id: string) => `/api/contracts/${id}/complete` as const,
  cancel: (id: string) => `/api/contracts/${id}/cancel` as const,
} as const;

/**
 * Banking endpoints
 */
export const bankingEndpoints = {
  banks: '/api/banking/banks',
  loans: '/api/banking/loans',
  applyLoan: '/api/banking/loans/apply',
  loanById: (id: string) => `/api/banking/loans/${id}` as const,
  payLoan: (id: string) => `/api/banking/loans/${id}/pay` as const,
  creditScore: (companyId: string) => `/api/banking/credit-score/${companyId}` as const,
  loanHistory: (companyId: string) => `/api/banking/loans/history/${companyId}` as const,
} as const;

/**
 * User endpoints
 */
export const userEndpoints = {
  profile: '/api/users/profile',
  update: '/api/users/profile',
  stats: '/api/users/stats',
  achievements: '/api/users/achievements',
  settings: '/api/users/settings',
} as const;

/**
 * Industry-specific endpoints (6 industries)
 */
export const industryEndpoints = {
  // Manufacturing
  manufacturing: {
    factories: '/api/industries/manufacturing/factories',
    products: '/api/industries/manufacturing/products',
    production: (factoryId: string) => `/api/industries/manufacturing/factories/${factoryId}/production` as const,
  },
  
  // E-Commerce
  ecommerce: {
    stores: '/api/industries/ecommerce/stores',
    products: '/api/industries/ecommerce/products',
    orders: '/api/industries/ecommerce/orders',
    inventory: (storeId: string) => `/api/industries/ecommerce/stores/${storeId}/inventory` as const,
  },
  
  // Technology
  technology: {
    projects: '/api/industries/technology/projects',
    products: '/api/industries/technology/products',
    deploy: (projectId: string) => `/api/industries/technology/projects/${projectId}/deploy` as const,
  },
  
  // Healthcare
  healthcare: {
    facilities: '/api/industries/healthcare/facilities',
    patients: '/api/industries/healthcare/patients',
    treatments: '/api/industries/healthcare/treatments',
    admissions: (facilityId: string) => `/api/industries/healthcare/facilities/${facilityId}/admissions` as const,
  },
  
  // Energy
  energy: {
    facilities: '/api/industries/energy/facilities',
    production: '/api/industries/energy/production',
    output: (facilityId: string) => `/api/industries/energy/facilities/${facilityId}/output` as const,
  },
  
  // Media
  media: {
    outlets: '/api/industries/media/outlets',
    content: '/api/industries/media/content',
    publish: (contentId: string) => `/api/industries/media/content/${contentId}/publish` as const,
  },
} as const;

/**
 * Admin endpoints
 */
export const adminEndpoints = {
  users: '/api/admin/users',
  companies: '/api/admin/companies',
  diagnostics: '/api/admin/diagnostics',
  metrics: '/api/admin/metrics',
  banUser: (userId: string) => `/api/admin/users/${userId}/ban` as const,
} as const;

/**
 * All endpoints consolidated
 */
export const endpoints = {
  auth: authEndpoints,
  companies: companyEndpoints,
  employees: employeeEndpoints,
  contracts: contractEndpoints,
  banking: bankingEndpoints,
  users: userEndpoints,
  industries: industryEndpoints,
  admin: adminEndpoints,
} as const;

/**
 * Type-safe endpoint path
 * Extracts the return type of endpoint functions
 */
export type EndpointPath = string;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Type Safety**: `as const` assertions provide literal string types
 * 2. **Dynamic Paths**: Functions for parameterized routes (e.g., /users/:id)
 * 3. **Nested Structure**: Organized by domain (auth, companies, banking, etc.)
 * 4. **Extensibility**: Easy to add new endpoints without breaking existing code
 * 5. **Zero Magic Strings**: All paths defined once, imported everywhere
 * 
 * PREVENTS:
 * - Magic strings scattered across 111 components (legacy build)
 * - Typos in endpoint paths
 * - Inconsistent URL patterns
 * - Endpoint path duplication
 * 
 * USAGE:
 * ```typescript
 * import { endpoints } from '@/lib/api/endpoints';
 * 
 * // Static endpoint
 * await apiClient.get(endpoints.auth.login);
 * 
 * // Dynamic endpoint
 * await apiClient.get(endpoints.companies.byId('123'));
 * 
 * // Industry-specific
 * await apiClient.get(endpoints.industries.healthcare.facilities);
 * ```
 */
