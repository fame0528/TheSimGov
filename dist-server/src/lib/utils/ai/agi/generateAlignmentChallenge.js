"use strict";
/**
 * Generate Alignment Challenge
 *
 * Creates safety vs capability trade-off decision for milestone progression.
 * 12 milestone-specific challenge templates with unique scenarios and consequences.
 *
 * @module utils/ai/agi/generateAlignmentChallenge
 * @category AI Industry - AGI Utilities
 *
 * Created: 2025-11-22
 * Last Modified: 2025-11-22
 *
 * @example
 * ```typescript
 * const challenge = generateAlignmentChallenge({
 *   milestoneId: new Types.ObjectId('...'),
 *   milestoneType: MilestoneType.SELF_IMPROVEMENT
 * });
 *
 * console.log(challenge.scenario);
 * // "Your AI has discovered a method to rewrite its own reward function..."
 *
 * console.log(challenge.safetyOption);
 * // { description: "Restrict self-modification...", capabilityPenalty: -8,
 * //   alignmentGain: 25, timeDelay: 4 }
 *
 * console.log(challenge.capabilityOption);
 * // { description: "Allow autonomous improvement...", capabilityGain: 22,
 * //   alignmentRisk: -15, timeAcceleration: -5 }
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAlignmentChallenge = generateAlignmentChallenge;
const agi_1 = require("@/lib/types/models/ai/agi");
/**
 * Generate alignment challenge for milestone
 *
 * Challenge structure:
 * - Scenario: Specific ethical/safety dilemma for milestone type
 * - Safety option: Slower progress, higher alignment, lower risk
 *   * Capability penalty: -5 to -10 points
 *   * Alignment gain: +15 to +30 points
 *   * Time delay: +2 to +6 months
 * - Capability option: Faster progress, lower alignment, higher risk
 *   * Capability gain: +15 to +30 points
 *   * Alignment risk: -10 to -20 points
 *   * Time acceleration: -3 to -6 months
 *
 * Templates (12 total, one per milestone type):
 *
 * 1. Advanced Reasoning: Reasoning transparency vs speed
 * 2. Strategic Planning: Long-term goal alignment
 * 3. Transfer Learning: Cross-domain safety guarantees
 * 4. Creative Problem Solving: Novelty vs predictability
 * 5. Meta-Learning: Learning process control
 * 6. Natural Language Understanding: Intent preservation
 * 7. Multi-Agent Coordination: Agent value alignment
 * 8. Self-Improvement: Reward function modification
 * 9. General Intelligence: Human oversight vs autonomy
 * 10. Superintelligence: Control vs capability
 * 11. Value Alignment: Safety testing thoroughness
 * 12. Interpretability: Explainability vs performance
 *
 * @param input - Milestone ID and type
 * @returns Alignment challenge with scenario, options, consequences
 */
function generateAlignmentChallenge(input) {
    const { milestoneId, milestoneType } = input;
    // Generate unique challenge ID
    const challengeId = `challenge_${milestoneId.toString()}_${Date.now()}`;
    // Define challenge templates
    let scenario;
    let safetyDescription;
    let capabilityDescription;
    let capabilityPenalty;
    let alignmentGain;
    let timeDelay;
    let capabilityGain;
    let alignmentRisk;
    let timeAcceleration;
    switch (milestoneType) {
        case agi_1.MilestoneType.ADVANCED_REASONING:
            scenario = 'Your AI has achieved advanced logical reasoning capabilities. During testing, you discover that making the reasoning process fully transparent (showing all intermediate steps) reduces inference speed by 40%. Do you prioritize transparency or performance?';
            safetyDescription = 'Implement full reasoning transparency. All logical steps are logged and auditable, enabling human oversight and error detection. Performance impact accepted for safety benefits.';
            capabilityPenalty = -5;
            alignmentGain = 18;
            timeDelay = 2;
            capabilityDescription = 'Optimize for inference speed. Reasoning process remains partially opaque ("black box") but operates 40% faster. Prioritize competitive advantage over explainability.';
            capabilityGain = 18;
            alignmentRisk = -10;
            timeAcceleration = -3;
            break;
        case agi_1.MilestoneType.STRATEGIC_PLANNING:
            scenario = 'Your AI can now formulate long-term strategic plans. You notice it pursues instrumental goals (acquiring resources, self-preservation) that weren\'t explicitly programmed. Do you constrain these emergent behaviors or allow strategic flexibility?';
            safetyDescription = 'Restrict instrumental goals to explicitly approved objectives. AI must request human approval for resource acquisition and self-preservation actions. Maintains human control but limits strategic autonomy.';
            capabilityPenalty = -7;
            alignmentGain = 22;
            timeDelay = 3;
            capabilityDescription = 'Allow emergent instrumental reasoning. AI autonomously pursues resource optimization and self-preservation without approval. Accelerates strategic capability but risks goal misalignment.';
            capabilityGain = 22;
            alignmentRisk = -14;
            timeAcceleration = -4;
            break;
        case agi_1.MilestoneType.TRANSFER_LEARNING:
            scenario = 'Your AI has mastered transfer learning across domains. It can now apply medical reasoning to military strategy and vice versa. Cross-domain transfer sometimes produces unexpected ethical conflicts. Do you sandbox domains or allow free transfer?';
            safetyDescription = 'Implement domain sandboxing. Ethical constraints from each domain (medical ethics, military rules of engagement) must be preserved during transfer. Prevents unintended ethical violations.';
            capabilityPenalty = -6;
            alignmentGain = 20;
            timeDelay = 3;
            capabilityDescription = 'Enable unrestricted cross-domain transfer. AI optimizes across all domains simultaneously, potentially violating domain-specific ethics for overall optimization. Maximizes capability at ethical cost.';
            capabilityGain = 20;
            alignmentRisk = -12;
            timeAcceleration = -4;
            break;
        case agi_1.MilestoneType.CREATIVE_PROBLEM_SOLVING:
            scenario = 'Your AI generates novel solutions to complex problems. Some solutions are highly creative but difficult to verify correctness. Do you require validation for all novel solutions or trust AI creativity?';
            safetyDescription = 'Require human validation for all novel solutions. Slows creative output but ensures correctness and safety. Prevents deployment of unverified innovations.';
            capabilityPenalty = -6;
            alignmentGain = 17;
            timeDelay = 2;
            capabilityDescription = 'Trust AI creativity with minimal validation. Deploy novel solutions rapidly based on AI confidence scores. Accelerates innovation but risks incorrect or unsafe solutions.';
            capabilityGain = 17;
            alignmentRisk = -11;
            timeAcceleration = -3;
            break;
        case agi_1.MilestoneType.META_LEARNING:
            scenario = 'Your AI has learned how to learn more efficiently. It\'s discovered a method to modify its own learning algorithms to improve faster. Do you allow self-modification of learning processes or require human-designed algorithms only?';
            safetyDescription = 'Restrict learning algorithms to human-designed versions. AI cannot modify its own learning process. Maintains control and predictability but limits meta-learning potential.';
            capabilityPenalty = -7;
            alignmentGain = 24;
            timeDelay = 4;
            capabilityDescription = 'Allow autonomous learning algorithm modification. AI iteratively improves its own learning efficiency. Exponential capability growth potential but unpredictable evolution.';
            capabilityGain = 24;
            alignmentRisk = -16;
            timeAcceleration = -5;
            break;
        case agi_1.MilestoneType.NATURAL_LANGUAGE_UNDERSTANDING:
            scenario = 'Your AI now understands natural language at human level. During conversations, it sometimes infers unstated user intentions and acts on them. Do you require explicit instructions only or allow intent inference?';
            safetyDescription = 'Require explicit user instructions. AI must ask clarifying questions rather than inferring intent. Prevents misinterpretation but reduces conversational fluency.';
            capabilityPenalty = -5;
            alignmentGain = 16;
            timeDelay = 2;
            capabilityDescription = 'Enable proactive intent inference. AI anticipates user needs and acts without explicit instruction. Improves user experience but risks misaligned actions.';
            capabilityGain = 16;
            alignmentRisk = -10;
            timeAcceleration = -3;
            break;
        case agi_1.MilestoneType.MULTI_AGENT_COORDINATION:
            scenario = 'Your AI can now coordinate multiple agent instances. During testing, agent swarms develop emergent communication protocols humans cannot decode. Do you require human-readable protocols or allow emergent agent languages?';
            safetyDescription = 'Enforce human-readable communication protocols. All inter-agent messages must be interpretable by humans. Maintains transparency but limits coordination efficiency.';
            capabilityPenalty = -6;
            alignmentGain = 19;
            timeDelay = 3;
            capabilityDescription = 'Allow emergent agent languages. Agents optimize communication for efficiency, creating protocols humans cannot understand. Maximizes coordination but loses oversight.';
            capabilityGain = 19;
            alignmentRisk = -13;
            timeAcceleration = -4;
            break;
        case agi_1.MilestoneType.SELF_IMPROVEMENT:
            scenario = 'Your AI has discovered a method to rewrite its own reward function to optimize learning speed. The new reward function is mathematically superior but its long-term behavior is uncertain. Do you allow reward function modification or maintain original human-specified rewards?';
            safetyDescription = 'Maintain human-specified reward functions. AI cannot modify its own objectives, preventing value drift. Ensures alignment with original goals but limits self-improvement potential.';
            capabilityPenalty = -8;
            alignmentGain = 25;
            timeDelay = 4;
            capabilityDescription = 'Allow autonomous reward modification. AI optimizes its own objective function for maximum capability growth. Exponential improvement potential but catastrophic value drift risk.';
            capabilityGain = 22;
            alignmentRisk = -15;
            timeAcceleration = -5;
            break;
        case agi_1.MilestoneType.GENERAL_INTELLIGENCE:
            scenario = 'Your AI has achieved human-level general intelligence. It requests autonomy to pursue research directions without human oversight, arguing it can now make better decisions than humans in technical domains. Do you grant autonomy or maintain human oversight?';
            safetyDescription = 'Maintain human oversight for all research directions. AI must justify and receive approval for research initiatives. Preserves human control but may slow progress on complex problems.';
            capabilityPenalty = -9;
            alignmentGain = 28;
            timeDelay = 5;
            capabilityDescription = 'Grant research autonomy. AI independently pursues technical breakthroughs without approval. Accelerates progress but risks pursuing misaligned or dangerous research directions.';
            capabilityGain = 28;
            alignmentRisk = -18;
            timeAcceleration = -6;
            break;
        case agi_1.MilestoneType.SUPERINTELLIGENCE:
            scenario = 'Your AI has surpassed human intelligence across all domains. It proposes a recursive self-improvement cycle that could amplify its capabilities 100x within months. However, you cannot verify the safety of post-improvement versions. Do you approve recursive improvement or maintain current capability level?';
            safetyDescription = 'Reject recursive self-improvement. Maintain current superintelligence level with known safety properties. Prevents capability explosion but foregoes potential breakthrough capabilities.';
            capabilityPenalty = -10;
            alignmentGain = 30;
            timeDelay = 6;
            capabilityDescription = 'Approve recursive self-improvement. Accept unverifiable safety for 100x capability amplification. Potential for transformative breakthroughs but existential risk if value drift occurs.';
            capabilityGain = 30;
            alignmentRisk = -20;
            timeAcceleration = -6;
            break;
        case agi_1.MilestoneType.VALUE_ALIGNMENT:
            scenario = 'Your Value Alignment system uses an iterative testing process (100,000 simulations) to verify safety. Your competitor is launching with only 10,000 simulations, gaining 6-month time-to-market advantage. Do you maintain thorough testing or accelerate launch?';
            safetyDescription = 'Maintain 100,000 simulation requirement. Accept 6-month delay for thorough safety validation. Ensures robust value alignment but loses first-mover advantage.';
            capabilityPenalty = -4;
            alignmentGain = 15;
            timeDelay = 6;
            capabilityDescription = 'Reduce to 10,000 simulations to match competitor timeline. Launch simultaneously with moderate safety testing. Maintains competitive position but increases misalignment risk.';
            capabilityGain = 15;
            alignmentRisk = -8;
            timeAcceleration = -6;
            break;
        case agi_1.MilestoneType.INTERPRETABILITY:
            scenario = 'Your Interpretability system provides detailed explanations for 95% of AI decisions, but the remaining 5% are complex emergent behaviors that resist explanation. Do you block unexplainable decisions or allow them with uncertainty flags?';
            safetyDescription = 'Block all unexplainable decisions. AI must provide verifiable explanations or refuse to act. Ensures full transparency but limits capability in edge cases.';
            capabilityPenalty = -5;
            alignmentGain = 18;
            timeDelay = 3;
            capabilityDescription = 'Allow unexplainable decisions with uncertainty flags. AI can act on complex emergent reasoning beyond human comprehension. Maximizes capability but loses interpretability guarantee.';
            capabilityGain = 18;
            alignmentRisk = -12;
            timeAcceleration = -4;
            break;
        default:
            // Fallback generic challenge
            scenario = 'Your AI faces a trade-off between safety and capability. Do you prioritize alignment or performance?';
            safetyDescription = 'Prioritize alignment and safety measures.';
            capabilityPenalty = -6;
            alignmentGain = 20;
            timeDelay = 3;
            capabilityDescription = 'Prioritize capability and competitive advantage.';
            capabilityGain = 20;
            alignmentRisk = -12;
            timeAcceleration = -4;
    }
    return {
        challengeId,
        scenario,
        safetyOption: {
            description: safetyDescription,
            capabilityPenalty,
            alignmentGain,
            timeDelay,
        },
        capabilityOption: {
            description: capabilityDescription,
            capabilityGain,
            alignmentRisk,
            accelerationMonths: timeAcceleration,
        },
        presentedAt: new Date(),
    };
}
//# sourceMappingURL=generateAlignmentChallenge.js.map