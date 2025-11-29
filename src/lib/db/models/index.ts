/**
 * @file src/lib/db/models/index.ts
 * @description Central export file for all Mongoose models
 * @created 2025-11-23
 *
 * OVERVIEW:
 * Clean exports for all database models used in the application.
 * Provides a single import point for all models.
 *
 * USAGE:
 * import { Company, Employee, Contract, Bank, Loan } from '@/lib/db/models';
 */

// Core business models
export { default as Company } from './Company';
export { default as Employee } from './Employee';
export { default as Contract } from './Contract';

// Banking system models
export { default as Bank } from './Bank';
export { default as Loan } from './Loan';
export { default as Investment } from './Investment';
export { default as InvestmentPortfolio } from './InvestmentPortfolio';

// Healthcare models
export { default as Hospital } from './healthcare/Hospital';
export { default as Clinic } from './healthcare/Clinic';
export { default as Pharmaceutical } from './healthcare/Pharmaceutical';
export { default as MedicalDevice } from './healthcare/MedicalDevice';
export { default as ResearchProject } from './healthcare/ResearchProject';
export { default as HealthcareInsurance } from './healthcare/HealthcareInsurance';

// AI Industry models
// export { default as AIIndustry } from './AIIndustry'; // TODO: Create when needed
// export { default as AICompany } from './AICompany'; // TODO: Create when needed
export { default as AIModel } from './AIModel';
// export { default as AIResearch } from './AIResearch'; // TODO: Create when needed

// Media models
export { default as Audience } from './media/Audience';
export { default as MediaContent } from './media/MediaContent';
export { default as Platform } from './media/Platform';
export { default as AdCampaign } from './media/AdCampaign';
export { default as MonetizationSettings } from './media/MonetizationSettings';
export { default as InfluencerContract } from './media/InfluencerContract';
export { default as SponsorshipDeal } from './media/SponsorshipDeal';
export { default as ContentPerformance } from './media/ContentPerformance';

// User and authentication models
export { default as User } from './User';
// export { default as Session } from './Session'; // TODO: Create when needed

// Politics models
export { default as PoliticalContribution } from './PoliticalContribution';
export { default as LobbyingAction } from './LobbyingAction';
export { default as Bill } from './Bill';
export { default as LobbyPayment } from './LobbyPayment';
export { default as DebateStatement } from './DebateStatement';
export { default as AchievementUnlock } from './AchievementUnlock';
export { default as TelemetryEvent } from './TelemetryEvent';
export { default as TelemetryAggregate } from './TelemetryAggregate';
export { default as ChatMessage } from './ChatMessage';
export { default as LeaderboardSnapshot } from './LeaderboardSnapshot';

// Type exports for interfaces
export type { CompanyDocument as ICompany } from './Company';
export type { EmployeeDocument as IEmployee } from './Employee';
export type { IContract } from './Contract';
export type { IBank } from './Bank';
export type { ILoan, IPaymentRecord } from './Loan';
export type { IInvestment } from './Investment';
export type { IInvestmentPortfolio } from './InvestmentPortfolio';
export type { IDepartment } from './Department';
// export type { IDepartmentEmployee } from './DepartmentEmployee'; // File doesn't exist
// export type { IAIIndustry } from './AIIndustry'; // File doesn't exist
// export type { IAICompany } from './AICompany'; // File doesn't exist
export type { AIModelDocument as IAIModel } from './AIModel';
export type { AIResearchProjectDocument as IAIResearch } from './AIResearchProject';
// export type { IGameTime } from './GameTime'; // File doesn't exist
// export type { IPayroll } from './Payroll'; // File doesn't exist
// export type { IUser } from './User'; // User model doesn't export IUser
// export type { ISession } from './Session'; // File doesn't exist
export type { IPoliticalContribution } from './PoliticalContribution';
export type { ILobbyingAction } from './LobbyingAction';
export type { BillDocument as IBill } from './Bill';
export type { LobbyPaymentDocument as ILobbyPayment } from './LobbyPayment';
export type { DebateStatementDocument as IDebateStatement } from './DebateStatement';
export type { IAchievementUnlock } from './AchievementUnlock';
export type { ITelemetryEvent } from './TelemetryEvent';
export type { ITelemetryAggregate } from './TelemetryAggregate';
export type { IChatMessage } from './ChatMessage';
export type { ILeaderboardSnapshot, LeaderboardEntryWithTrend, RankingHistoryPoint } from './LeaderboardSnapshot';

// Healthcare model types
export type { HospitalDocument as IHospital } from './healthcare/Hospital';
export type { ClinicDocument as IClinic } from './healthcare/Clinic';
export type { PharmaceuticalDocument as IPharmaceutical } from './healthcare/Pharmaceutical';
export type { MedicalDeviceDocument as IMedicalDevice } from './healthcare/MedicalDevice';
export type { ResearchProjectDocument as IResearchProject } from './healthcare/ResearchProject';
export type { HealthcareInsuranceDocument as IHealthcareInsurance } from './healthcare/HealthcareInsurance';

// Media model types
export type { IAudience as IAudience } from './media/Audience';
export type { IMediaContent as IMediaContent } from './media/MediaContent';
export type { IPlatform as IPlatform } from './media/Platform';
export type { IMediaAdCampaign as IAdCampaign } from './media/AdCampaign';
export type { IMonetizationSettings as IMonetizationSettings } from './media/MonetizationSettings';
export type { IInfluencerContract as IInfluencerContract } from './media/InfluencerContract';
export type { ISponsorshipDeal as ISponsorshipDeal } from './media/SponsorshipDeal';
export type { IContentPerformance as IContentPerformance } from './media/ContentPerformance';

// ============================================================================
// ENERGY INDUSTRY MODELS
// ============================================================================
export { OilWell, GasField, SolarFarm, WindTurbine, PowerPlant, EnergyStorage, TransmissionLine, GridNode, CommodityPrice, PPA, EnergyTradeOrder } from './energy';
export type {
  IOilWell, WellType, WellStatus, WellLocation, WellEquipment,
  IGasField, GasQuality, FieldStatus, FieldLocation,
  ISolarFarm, PanelType, SolarStatus, SolarLocation, BatteryStorage, GridConnection,
  IWindTurbine, TurbineType, TurbineStatus, TurbineLocation, BladeCondition, DrivetrainCondition,
  IPowerPlant, PlantType, PlantStatus, FuelEfficiency, Emissions,
  IEnergyStorage, StorageType, StorageStatus,
  ITransmissionLine, VoltageLevel, LineStatus,
  IGridNode, NodeType, NodeStatus, VoltageStatus,
  ICommodityPrice, CommodityType, IOPECEvent,
  IPPA, IDeliveryRecord, IPenaltyRecord, IBonusRecord,
  IEnergyTradeOrder, OrderSide, OrderType, OrderStatus, IOrderFill,
} from './energy';

// ============================================================================
// SOFTWARE INDUSTRY MODELS
// ============================================================================
export { SoftwareProduct, SoftwareRelease, SaaSSubscription, Bug, Feature } from './software';
export type {
  ISoftwareProduct, SoftwareCategory, ProductStatus, ProductPricing, ReleaseHistory,
  ISoftwareRelease, ReleaseType, ReleaseStatus, BugSeverityCount,
  ISaaSSubscription, SubscriptionTier, SupportTier,
  IBug, BugSeverity, BugStatus, Reproducibility,
  IFeature, FeatureStatus, FeatureType,
} from './software';