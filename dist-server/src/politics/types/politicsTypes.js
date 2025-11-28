"use strict";
/**
 * OVERVIEW
 * Strongly-typed political domain primitives used across engines and APIs.
 * Human-only multiplayer: no AI/NPC players. All scheduling uses the 168× time model.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignPhaseId = exports.PoliticalOfficeKind = exports.PoliticalOfficeLevel = void 0;
var PoliticalOfficeLevel;
(function (PoliticalOfficeLevel) {
    PoliticalOfficeLevel["Local"] = "Local";
    PoliticalOfficeLevel["State"] = "State";
    PoliticalOfficeLevel["Federal"] = "Federal";
})(PoliticalOfficeLevel || (exports.PoliticalOfficeLevel = PoliticalOfficeLevel = {}));
var PoliticalOfficeKind;
(function (PoliticalOfficeKind) {
    PoliticalOfficeKind["House"] = "House";
    PoliticalOfficeKind["Senate"] = "Senate";
    PoliticalOfficeKind["Governor"] = "Governor";
    PoliticalOfficeKind["President"] = "President";
    PoliticalOfficeKind["Legislature"] = "Legislature";
    PoliticalOfficeKind["Mayor"] = "Mayor";
})(PoliticalOfficeKind || (exports.PoliticalOfficeKind = PoliticalOfficeKind = {}));
var CampaignPhaseId;
(function (CampaignPhaseId) {
    CampaignPhaseId["Early"] = "Early";
    CampaignPhaseId["Mid"] = "Mid";
    CampaignPhaseId["Late"] = "Late";
    CampaignPhaseId["Final"] = "Final";
})(CampaignPhaseId || (exports.CampaignPhaseId = CampaignPhaseId = {}));
/**
 * Notes
 * - All utilities should accept/return pure data types defined here.
 * - GameWeekIndex anchors scheduling and avoids ad-hoc time math across code.
 */
//# sourceMappingURL=politicsTypes.js.map