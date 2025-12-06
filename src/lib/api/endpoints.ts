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
 * Banking endpoints (player as borrower - existing system)
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
 * Player Banking endpoints (player as lender - new empire system)
 * Player runs their own bank, issues loans to NPCs, accepts deposits
 */
export const playerBankingEndpoints = {
  // Bank Settings & Configuration
  settings: {
    get: '/api/banking/player/settings',
    update: '/api/banking/player/settings',
    levelUp: '/api/banking/player/settings', // POST with action: 'levelUp'
  },
  
  // Loan Applicants (NPCs wanting loans from player's bank)
  applicants: {
    list: '/api/banking/player/applicants',
    generate: '/api/banking/player/applicants', // POST to generate new applicants
    approve: (id: string) => `/api/banking/player/applicants/${id}` as const, // POST with action: 'approve'
    reject: (id: string) => `/api/banking/player/applicants/${id}` as const, // POST with action: 'reject'
  },
  
  // Bank Loans (loans issued BY player's bank to NPCs)
  bankLoans: {
    list: '/api/banking/player/bank-loans',
    byId: (id: string) => `/api/banking/player/bank-loans/${id}` as const,
    processPayment: (id: string) => `/api/banking/player/bank-loans/${id}/payment` as const,
    writeOff: (id: string) => `/api/banking/player/bank-loans/${id}` as const, // DELETE
  },
  
  // Deposits (customer deposits INTO player's bank)
  deposits: {
    list: '/api/banking/player/deposits',
    accept: '/api/banking/player/deposits', // POST to accept new deposit
  },
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

  export const coreLoopEndpoints = {
    state: '/api/core-loop', // GET: current state
    advance: '/api/core-loop', // POST: advance tick
  } as const;
/**
 * AI Industry endpoints (Technology + AI subcategory)
 * Covers models, research, infrastructure, talent, marketplace
 */
export const aiEndpoints = {
  // AI Models
  models: {
    list: (companyId: string) => `/api/ai/models?companyId=${companyId}` as const,
    create: '/api/ai/models',
    byId: (id: string) => `/api/ai/models/${id}` as const,
    train: (id: string) => `/api/ai/models/${id}/train` as const,
    deploy: (id: string) => `/api/ai/models/${id}/deploy` as const,
  },
  
  // Research Projects
  research: {
    projects: (companyId: string) => `/api/ai/research/projects?companyId=${companyId}` as const,
    create: '/api/ai/research/projects',
    byId: (id: string) => `/api/ai/research/projects/${id}` as const,
    breakthroughs: (companyId: string) => `/api/ai/breakthroughs?companyId=${companyId}` as const,
    patents: (companyId: string) => `/api/ai/patents?companyId=${companyId}` as const,
  },
  
  // Infrastructure (GPU clusters, data centers)
  infrastructure: {
    gpuClusters: (companyId: string) => `/api/ai/infrastructure?companyId=${companyId}` as const,
    pueTrend: (companyId: string) => `/api/ai/infrastructure/pue-trend?companyId=${companyId}` as const,
    powerUtilization: (companyId: string) => `/api/ai/infrastructure/power-utilization?companyId=${companyId}` as const,
    alerts: (companyId: string) => `/api/ai/infrastructure/alerts?companyId=${companyId}` as const,
  },
  
  // Talent
  talent: {
    list: (companyId: string) => `/api/ai/talent?companyId=${companyId}` as const,
    marketplace: '/api/ai/talent/marketplace',
    hire: '/api/ai/talent/hire',
  },
  
  // Marketplace (model monetization)
  marketplace: {
    list: '/api/ai/marketplace',
    publish: (modelId: string) => `/api/ai/marketplace/${modelId}/publish` as const,
    revenue: (companyId: string) => `/api/ai/marketplace/revenue?companyId=${companyId}` as const,
  },
  
  // Competition
  competition: {
    global: '/api/ai/global-competition',
    dominance: (companyId: string) => `/api/ai/dominance?companyId=${companyId}` as const,
    leaderboard: '/api/ai/global-competition/leaderboard',
  },
  
  // Summary (for dashboard)
  summary: (companyId: string) => `/api/ai/summary?companyId=${companyId}` as const,
} as const;

/**
 * Energy Industry endpoints
 * Covers oil wells, gas fields, solar farms, wind turbines, 
 * power plants, storage, and transmission infrastructure
 */
export const energyEndpoints = {
  // Oil Wells
  oilWells: {
    list: (companyId: string) => `/api/energy/oil-wells?company=${companyId}` as const,
    create: '/api/energy/oil-wells',
    byId: (id: string) => `/api/energy/oil-wells/${id}` as const,
    update: (id: string) => `/api/energy/oil-wells/${id}` as const,
    delete: (id: string) => `/api/energy/oil-wells/${id}` as const,
  },
  
  // Gas Fields
  gasFields: {
    list: (companyId: string) => `/api/energy/gas-fields?company=${companyId}` as const,
    create: '/api/energy/gas-fields',
    byId: (id: string) => `/api/energy/gas-fields/${id}` as const,
    update: (id: string) => `/api/energy/gas-fields/${id}` as const,
    delete: (id: string) => `/api/energy/gas-fields/${id}` as const,
  },
  
  // Solar Farms
  solarFarms: {
    list: (companyId: string) => `/api/energy/solar-farms?company=${companyId}` as const,
    create: '/api/energy/solar-farms',
    byId: (id: string) => `/api/energy/solar-farms/${id}` as const,
    update: (id: string) => `/api/energy/solar-farms/${id}` as const,
    delete: (id: string) => `/api/energy/solar-farms/${id}` as const,
  },
  
  // Wind Turbines
  windTurbines: {
    list: (companyId: string) => `/api/energy/wind-turbines?company=${companyId}` as const,
    create: '/api/energy/wind-turbines',
    byId: (id: string) => `/api/energy/wind-turbines/${id}` as const,
    update: (id: string) => `/api/energy/wind-turbines/${id}` as const,
    delete: (id: string) => `/api/energy/wind-turbines/${id}` as const,
  },
  
  // Power Plants
  powerPlants: {
    list: (companyId: string) => `/api/energy/power-plants?company=${companyId}` as const,
    create: '/api/energy/power-plants',
    byId: (id: string) => `/api/energy/power-plants/${id}` as const,
    update: (id: string) => `/api/energy/power-plants/${id}` as const,
    delete: (id: string) => `/api/energy/power-plants/${id}` as const,
  },
  
  // Energy Storage
  storage: {
    list: (companyId: string) => `/api/energy/storage?company=${companyId}` as const,
    create: '/api/energy/storage',
    byId: (id: string) => `/api/energy/storage/${id}` as const,
    update: (id: string) => `/api/energy/storage/${id}` as const,
    delete: (id: string) => `/api/energy/storage/${id}` as const,
  },
  
  // Transmission Lines
  transmissionLines: {
    list: (companyId: string) => `/api/energy/transmission-lines?company=${companyId}` as const,
    create: '/api/energy/transmission-lines',
    byId: (id: string) => `/api/energy/transmission-lines/${id}` as const,
    update: (id: string) => `/api/energy/transmission-lines/${id}` as const,
    delete: (id: string) => `/api/energy/transmission-lines/${id}` as const,
  },
  
  // Summary endpoint for dashboard
  summary: (companyId: string) => `/api/energy/summary?company=${companyId}` as const,
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
 * Messages endpoints
 * In-game player-to-player messaging system
 */
export const messagesEndpoints = {
  // Core CRUD
  list: '/api/messages',
  create: '/api/messages',
  byId: (id: string) => `/api/messages/${id}` as const,
  update: (id: string) => `/api/messages/${id}` as const,
  delete: (id: string) => `/api/messages/${id}` as const,
  
  // Folder views
  inbox: '/api/messages?folder=inbox',
  sent: '/api/messages?folder=sent',
  starred: '/api/messages?folder=starred',
  trash: '/api/messages?folder=trash',
  
  // Folder with pagination
  folder: (folder: string, page: number = 1, limit: number = 20) =>
    `/api/messages?folder=${folder}&page=${page}&limit=${limit}` as const,
  
  // Thread view
  thread: (threadId: string) => `/api/messages?threadId=${threadId}` as const,
  
  // Search
  search: (query: string, folder: string = 'inbox') =>
    `/api/messages?folder=${folder}&search=${encodeURIComponent(query)}` as const,
  
  // Unread count
  unread: '/api/messages/unread',
} as const;

/**
 * Software Industry endpoints
 * Covers software products, releases, bugs, features, and SaaS subscriptions
 */
export const softwareEndpoints = {
  // Software Products
  products: {
    list: (companyId: string) => `/api/software/products?company=${companyId}` as const,
    create: '/api/software/products',
    byId: (id: string) => `/api/software/products/${id}` as const,
    update: (id: string) => `/api/software/products/${id}` as const,
    delete: (id: string) => `/api/software/products/${id}` as const,
  },
  
  // Software Releases
  releases: {
    list: (productId: string) => `/api/software/releases?product=${productId}` as const,
    create: '/api/software/releases',
    byId: (id: string) => `/api/software/releases/${id}` as const,
    update: (id: string) => `/api/software/releases/${id}` as const,
    delete: (id: string) => `/api/software/releases/${id}` as const,
  },
  
  // Bugs
  bugs: {
    list: (productId: string) => `/api/software/bugs?product=${productId}` as const,
    create: '/api/software/bugs',
    byId: (id: string) => `/api/software/bugs/${id}` as const,
    update: (id: string) => `/api/software/bugs/${id}` as const,
    delete: (id: string) => `/api/software/bugs/${id}` as const,
  },
  
  // Features
  features: {
    list: (productId: string) => `/api/software/features?product=${productId}` as const,
    create: '/api/software/features',
    byId: (id: string) => `/api/software/features/${id}` as const,
    update: (id: string) => `/api/software/features/${id}` as const,
    delete: (id: string) => `/api/software/features/${id}` as const,
  },
  
  // SaaS Subscriptions
  saas: {
    list: (productId: string) => `/api/software/saas?product=${productId}` as const,
    create: '/api/software/saas',
    byId: (id: string) => `/api/software/saas/${id}` as const,
    update: (id: string) => `/api/software/saas/${id}` as const,
    delete: (id: string) => `/api/software/saas/${id}` as const,
  },
  
  // Summary endpoint for dashboard
  summary: (companyId: string) => `/api/software/summary?companyId=${companyId}` as const,
} as const;

/**
 * E-Commerce Industry endpoints
 * Covers products, orders, reviews, and marketing campaigns
 */
export const ecommerceEndpoints = {
  // Product Listings
  products: {
    list: (companyId: string) => `/api/ecommerce/products?company=${companyId}` as const,
    create: '/api/ecommerce/products',
    byId: (id: string) => `/api/ecommerce/products/${id}` as const,
    update: (id: string) => `/api/ecommerce/products/${id}` as const,
    delete: (id: string) => `/api/ecommerce/products/${id}` as const,
  },
  
  // Orders
  orders: {
    list: (companyId: string) => `/api/ecommerce/orders?company=${companyId}` as const,
    create: '/api/ecommerce/orders',
    byId: (id: string) => `/api/ecommerce/orders/${id}` as const,
    update: (id: string) => `/api/ecommerce/orders/${id}` as const,
    delete: (id: string) => `/api/ecommerce/orders/${id}` as const,
  },
  
  // Customer Reviews
  reviews: {
    list: (companyId: string) => `/api/ecommerce/reviews?company=${companyId}` as const,
    byProduct: (productId: string) => `/api/ecommerce/reviews?product=${productId}` as const,
    create: '/api/ecommerce/reviews',
    byId: (id: string) => `/api/ecommerce/reviews/${id}` as const,
    update: (id: string) => `/api/ecommerce/reviews/${id}` as const,
    delete: (id: string) => `/api/ecommerce/reviews/${id}` as const,
  },
  
  // SEO/PPC Campaigns
  campaigns: {
    list: (companyId: string) => `/api/ecommerce/campaigns?company=${companyId}` as const,
    create: '/api/ecommerce/campaigns',
    byId: (id: string) => `/api/ecommerce/campaigns/${id}` as const,
    update: (id: string) => `/api/ecommerce/campaigns/${id}` as const,
    delete: (id: string) => `/api/ecommerce/campaigns/${id}` as const,
  },
  
  // Summary endpoint for dashboard
  summary: (companyId: string) => `/api/ecommerce/summary?company=${companyId}` as const,
} as const;

/**
 * Consulting Industry endpoints
 * Covers consulting projects, time tracking, billing,
 * client management, and profitability metrics
 */
export const consultingEndpoints = {
  // Consulting Projects
  projects: {
    list: (companyId: string) => `/api/consulting/projects?company=${companyId}` as const,
    listWithMetrics: (companyId: string) => `/api/consulting/projects?company=${companyId}&includeMetrics=true` as const,
    listWithRecommendations: (companyId: string) => `/api/consulting/projects?company=${companyId}&includeRecommendations=true` as const,
    create: '/api/consulting/projects',
    byId: (id: string) => `/api/consulting/projects/${id}` as const,
    update: (id: string) => `/api/consulting/projects/${id}` as const,
    delete: (id: string) => `/api/consulting/projects/${id}` as const,
  },
  
  // Project filtering
  filters: {
    byStatus: (companyId: string, status: string) => `/api/consulting/projects?company=${companyId}&status=${status}` as const,
    byType: (companyId: string, type: string) => `/api/consulting/projects?company=${companyId}&projectType=${type}` as const,
    byClient: (companyId: string, client: string) => `/api/consulting/projects?company=${companyId}&client=${encodeURIComponent(client)}` as const,
    byBillingModel: (companyId: string, model: string) => `/api/consulting/projects?company=${companyId}&billingModel=${model}` as const,
  },
  
  // Summary endpoint for dashboard
  summary: (companyId: string) => `/api/consulting/projects?company=${companyId}&includeMetrics=true&includeRecommendations=true` as const,
} as const;

/**
 * Manufacturing Industry endpoints
 * Covers facilities, production lines, suppliers, inventory,
 * quality metrics, and supply chain management
 */
export const manufacturingEndpoints = {
  // Manufacturing Facilities
  facilities: {
    list: (companyId: string) => `/api/manufacturing/facilities?company=${companyId}` as const,
    create: '/api/manufacturing/facilities',
    byId: (id: string) => `/api/manufacturing/facilities/${id}` as const,
    update: (id: string) => `/api/manufacturing/facilities/${id}` as const,
    delete: (id: string) => `/api/manufacturing/facilities/${id}` as const,
  },
  
  // Production Lines
  productionLines: {
    list: (companyId: string) => `/api/manufacturing/production-lines?company=${companyId}` as const,
    byFacility: (facilityId: string) => `/api/manufacturing/production-lines?facility=${facilityId}` as const,
    create: '/api/manufacturing/production-lines',
    byId: (id: string) => `/api/manufacturing/production-lines/${id}` as const,
    update: (id: string) => `/api/manufacturing/production-lines/${id}` as const,
    delete: (id: string) => `/api/manufacturing/production-lines/${id}` as const,
  },
  
  // Suppliers
  suppliers: {
    list: (companyId: string) => `/api/manufacturing/suppliers?company=${companyId}` as const,
    create: '/api/manufacturing/suppliers',
    byId: (id: string) => `/api/manufacturing/suppliers/${id}` as const,
    update: (id: string) => `/api/manufacturing/suppliers/${id}` as const,
    delete: (id: string) => `/api/manufacturing/suppliers/${id}` as const,
    scorecard: (id: string) => `/api/manufacturing/suppliers/${id}/scorecard` as const,
  },
  
  // Inventory
  inventory: {
    list: (companyId: string) => `/api/manufacturing/inventory?company=${companyId}` as const,
    byFacility: (facilityId: string) => `/api/manufacturing/inventory?facility=${facilityId}` as const,
    create: '/api/manufacturing/inventory',
    byId: (id: string) => `/api/manufacturing/inventory/${id}` as const,
    update: (id: string) => `/api/manufacturing/inventory/${id}` as const,
    adjustStock: (id: string) => `/api/manufacturing/inventory/${id}/adjust` as const,
  },
  
  // Quality Metrics (OEE, Six Sigma, etc.)
  quality: {
    oee: (facilityId: string) => `/api/manufacturing/quality/oee?facility=${facilityId}` as const,
    sixSigma: (facilityId: string) => `/api/manufacturing/quality/six-sigma?facility=${facilityId}` as const,
    defects: (companyId: string) => `/api/manufacturing/quality/defects?company=${companyId}` as const,
    trends: (companyId: string) => `/api/manufacturing/quality/trends?company=${companyId}` as const,
  },
  
  // Procurement
  procurement: {
    orders: (companyId: string) => `/api/manufacturing/procurement?company=${companyId}` as const,
    create: '/api/manufacturing/procurement',
    byId: (id: string) => `/api/manufacturing/procurement/${id}` as const,
    approve: (id: string) => `/api/manufacturing/procurement/${id}/approve` as const,
    receive: (id: string) => `/api/manufacturing/procurement/${id}/receive` as const,
  },
  
  // Summary endpoint for dashboard
  summary: (companyId: string) => `/api/manufacturing/summary?companyId=${companyId}` as const,
} as const;

/**
 * Crime Industry endpoints (Phase 1 Alpha + Phase 2 Beta + Phase 11 MMO)
 * Phase 1: Production, distribution, marketplace, laundering, heat
 * Phase 2: Gangs, territories, turf wars, travel/state pricing
 * Phase 11: Street Trading MMO - Buy/sell drugs, travel between states
 */
export const crimeEndpoints = {
  // Phase 1 (Alpha) - Economic Loop
  facilities: '/api/crime/facilities',
  routes: '/api/crime/routes',
  marketplace: '/api/crime/marketplace',
  laundering: '/api/crime/laundering',
  heat: '/api/crime/heat',
  
  // Phase 11 (MMO) - Street Trading Core
  stash: {
    get: '/api/crime/stash',
    initialize: '/api/crime/stash',
    travel: '/api/crime/stash/travel',
  },
  
  trading: {
    buySell: '/api/crime/trading/buy-sell',
  },
  
  pricing: {
    byState: (state: string) => `/api/crime/pricing?state=${state}` as const,
    all: '/api/crime/pricing?all=true',
  },
  
  // Phase 2 (Beta) - MMO Social Layer
  gangs: {
    list: '/api/crime/gangs',
    create: '/api/crime/gangs',
    byId: (id: string) => `/api/crime/gangs/${id}` as const,
    members: (id: string) => `/api/crime/gangs/${id}/members` as const,
    addMember: (id: string) => `/api/crime/gangs/${id}/members` as const,
    updateMember: (id: string) => `/api/crime/gangs/${id}/members` as const,
    removeMember: (id: string, userId: string) => `/api/crime/gangs/${id}/members?userId=${userId}` as const,
  },
  
  territories: {
    list: '/api/crime/territories',
    create: '/api/crime/territories',
    claim: '/api/crime/territories',
    byId: (id: string) => `/api/crime/territories/${id}` as const,
    byState: (state: string) => `/api/crime/territories?state=${state}` as const,
    byCity: (state: string, city: string) => `/api/crime/territories?state=${state}&city=${city}` as const,
    byGang: (gangId: string) => `/api/crime/territories?controlledBy=${gangId}` as const,
  },
  
  turfWars: {
    list: '/api/crime/turf-wars',
    create: '/api/crime/turf-wars',
    byId: (id: string) => `/api/crime/turf-wars/${id}` as const,
    resolve: (id: string) => `/api/crime/turf-wars/${id}` as const,
    byTerritory: (territoryId: string) => `/api/crime/turf-wars?territoryId=${territoryId}` as const,
    byGang: (gangId: string) => `/api/crime/turf-wars?gangId=${gangId}` as const,
  },
  
  travel: {
    pricing: (state: string, substance: string) => `/api/crime/travel/pricing?state=${state}&substance=${substance}` as const,
    initiate: '/api/crime/travel',
  },
  
  // Phase 3 (Gamma) - Integration Layer
  legislation: {
    list: '/api/crime/legislation',
    lobby: '/api/crime/legislation/lobby',
    bills: '/api/crime/legislation/bills',
  },
  blackMarket: {
    list: '/api/crime/black-market',
    create: '/api/crime/black-market',
    byId: (id: string) => `/api/crime/black-market/${id}` as const,
    update: (id: string) => `/api/crime/black-market/${id}` as const,
    delete: (id: string) => `/api/crime/black-market/${id}` as const,
    purchase: (id: string) => `/api/crime/black-market/${id}/purchase` as const,
  },
  conversion: {
    convert: '/api/crime/conversion/convert',
  },
} as const;

/**
 * Politics Industry endpoints
 * Covers elections, campaigns, bills, donors, districts, and voter outreach
 */
export const politicsEndpoints = {
  // Elections
  elections: {
    list: (companyId: string) => `/api/politics/elections?company=${companyId}` as const,
    create: '/api/politics/elections',
    byId: (id: string) => `/api/politics/elections/${id}` as const,
    update: (id: string) => `/api/politics/elections/${id}` as const,
    delete: (id: string) => `/api/politics/elections/${id}` as const,
    byType: (companyId: string, type: string) => `/api/politics/elections?company=${companyId}&electionType=${type}` as const,
    byStatus: (companyId: string, status: string) => `/api/politics/elections?company=${companyId}&status=${status}` as const,
  },
  
  // Campaigns
  campaigns: {
    list: (companyId: string) => `/api/politics/campaigns?company=${companyId}` as const,
    create: '/api/politics/campaigns',
    byId: (id: string) => `/api/politics/campaigns/${id}` as const,
    update: (id: string) => `/api/politics/campaigns/${id}` as const,
    delete: (id: string) => `/api/politics/campaigns/${id}` as const,
    byParty: (companyId: string, party: string) => `/api/politics/campaigns?company=${companyId}&party=${party}` as const,
    byStatus: (companyId: string, status: string) => `/api/politics/campaigns?company=${companyId}&status=${status}` as const,
  },
  
  // Bills
  bills: {
    list: (companyId: string) => `/api/politics/bills?company=${companyId}` as const,
    create: '/api/politics/bills',
    byId: (id: string) => `/api/politics/bills/${id}` as const,
    update: (id: string) => `/api/politics/bills/${id}` as const,
    delete: (id: string) => `/api/politics/bills/${id}` as const,
    byCategory: (companyId: string, category: string) => `/api/politics/bills?company=${companyId}&category=${category}` as const,
    byStatus: (companyId: string, status: string) => `/api/politics/bills?company=${companyId}&status=${status}` as const,
  },
  
  // Donors
  donors: {
    list: (companyId: string) => `/api/politics/donors?company=${companyId}` as const,
    byCampaign: (campaignId: string) => `/api/politics/donors?campaign=${campaignId}` as const,
    create: '/api/politics/donors',
    byId: (id: string) => `/api/politics/donors/${id}` as const,
    update: (id: string) => `/api/politics/donors/${id}` as const,
    delete: (id: string) => `/api/politics/donors/${id}` as const,
    byType: (companyId: string, donorType: string) => `/api/politics/donors?company=${companyId}&donorType=${donorType}` as const,
  },
  
  // Districts
  districts: {
    list: (companyId: string) => `/api/politics/districts?company=${companyId}` as const,
    create: '/api/politics/districts',
    byId: (id: string) => `/api/politics/districts/${id}` as const,
    update: (id: string) => `/api/politics/districts/${id}` as const,
    delete: (id: string) => `/api/politics/districts/${id}` as const,
    byState: (companyId: string, state: string) => `/api/politics/districts?company=${companyId}&state=${state}` as const,
    byType: (companyId: string, type: string) => `/api/politics/districts?company=${companyId}&districtType=${type}` as const,
  },
  
  // Voter Outreach
  outreach: {
    list: (companyId: string) => `/api/politics/outreach?company=${companyId}` as const,
    byCampaign: (campaignId: string) => `/api/politics/outreach?campaign=${campaignId}` as const,
    create: '/api/politics/outreach',
    byId: (id: string) => `/api/politics/outreach/${id}` as const,
    update: (id: string) => `/api/politics/outreach/${id}` as const,
    delete: (id: string) => `/api/politics/outreach/${id}` as const,
    byType: (companyId: string, type: string) => `/api/politics/outreach?company=${companyId}&outreachType=${type}` as const,
  },
  
  // Summary endpoint for dashboard
  summary: (companyId: string) => `/api/politics/summary?companyId=${companyId}` as const,
} as const;

/**
 * Empire endpoints (Interconnected Empire System)
 * Tracks player-owned companies, synergies, and resource flows
 */
export const empireEndpoints = {
  // Synergies
  synergies: {
    list: '/api/empire/synergies',
    calculate: '/api/empire/synergies', // POST to recalculate
    definitions: '/api/empire/synergies/definitions',
    withProjections: '/api/empire/synergies?includeProjections=true',
    withSummary: '/api/empire/synergies?includeSummary=true',
  },
  
  // Empire Companies
  companies: {
    list: '/api/empire/companies',
    add: '/api/empire/companies', // POST
    update: '/api/empire/companies', // PATCH
    remove: (companyId: string) => `/api/empire/companies?companyId=${companyId}` as const, // DELETE
    withFlows: '/api/empire/companies?includeFlows=true',
  },
  
  // Resource Flows
  flows: {
    list: '/api/empire/flows',
    create: '/api/empire/flows', // POST
    byId: (id: string) => `/api/empire/flows/${id}` as const,
    pause: (id: string) => `/api/empire/flows/${id}/pause` as const,
    resume: (id: string) => `/api/empire/flows/${id}/resume` as const,
    cancel: (id: string) => `/api/empire/flows/${id}` as const, // DELETE
  },
  
  // Empire Overview
  dashboard: '/api/empire/dashboard',
  leaderboard: '/api/empire/leaderboard',
} as const;

/**
 * All endpoints consolidated
 */
/**
 * Logistics endpoints
 * Covers vehicles, warehouses, routes, contracts, shipments
 */
export const logisticsEndpoints = {
  vehicles: {
    list: (companyId: string) => `/api/logistics/vehicles?company=${companyId}` as const,
    create: '/api/logistics/vehicles',
    byId: (id: string) => `/api/logistics/vehicle/${id}` as const,
    update: (id: string) => `/api/logistics/vehicle/${id}` as const,
    delete: (id: string) => `/api/logistics/vehicle/${id}` as const,
  },
  warehouses: {
    list: (companyId: string) => `/api/logistics/warehouses?company=${companyId}` as const,
    create: '/api/logistics/warehouses',
    byId: (id: string) => `/api/logistics/warehouse/${id}` as const,
    update: (id: string) => `/api/logistics/warehouse/${id}` as const,
    delete: (id: string) => `/api/logistics/warehouse/${id}` as const,
  },
  routes: {
    list: (companyId: string) => `/api/logistics/routes?company=${companyId}` as const,
    create: '/api/logistics/routes',
    byId: (id: string) => `/api/logistics/route/${id}` as const,
    update: (id: string) => `/api/logistics/route/${id}` as const,
    delete: (id: string) => `/api/logistics/route/${id}` as const,
  },
  contracts: {
    list: (companyId: string) => `/api/logistics/contracts?company=${companyId}` as const,
    create: '/api/logistics/contracts',
    byId: (id: string) => `/api/logistics/contract/${id}` as const,
    update: (id: string) => `/api/logistics/contract/${id}` as const,
    delete: (id: string) => `/api/logistics/contract/${id}` as const,
  },
  shipments: {
    list: (companyId: string) => `/api/logistics/shipments?company=${companyId}` as const,
    create: '/api/logistics/shipments',
    byId: (id: string) => `/api/logistics/shipment/${id}` as const,
    update: (id: string) => `/api/logistics/shipment/${id}` as const,
    delete: (id: string) => `/api/logistics/shipment/${id}` as const,
  },
  summary: (companyId: string) => `/api/logistics/summary?company=${companyId}` as const,
} as const;

export const endpoints = {
  auth: authEndpoints,
  companies: companyEndpoints,
  employees: employeeEndpoints,
  contracts: contractEndpoints,
  banking: bankingEndpoints,
  playerBanking: playerBankingEndpoints,
  users: userEndpoints,
  industries: industryEndpoints,
  ai: aiEndpoints,
  energy: energyEndpoints,
  software: softwareEndpoints,
  ecommerce: ecommerceEndpoints,
  manufacturing: manufacturingEndpoints,
  consulting: consultingEndpoints,
  crime: crimeEndpoints,
  politics: politicsEndpoints,
  admin: adminEndpoints,
  messages: messagesEndpoints,
  empire: empireEndpoints,
  coreLoop: coreLoopEndpoints,
  logistics: logisticsEndpoints,
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
 * 
 * // Politics-specific
 * await apiClient.get(endpoints.politics.elections.list(companyId));
 * ```
 */
