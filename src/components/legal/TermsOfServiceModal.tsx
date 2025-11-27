/**
 * @fileoverview Terms of Service Modal
 * @module components/legal/TermsOfServiceModal
 * 
 * OVERVIEW:
 * Modal component displaying complete Terms of Service for the political simulation game.
 * Comprehensive legal document covering user accounts, game mechanics, conduct, IP rights.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * TermsOfServiceModal - Complete TOS in scrollable modal
 * 
 * @param isOpen - Modal visibility state
 * @param onClose - Function to close modal
 * @returns Terms of Service modal component
 */
export default function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        base: 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10',
        header: 'border-b border-white/10',
        body: 'py-6',
        footer: 'border-t border-white/10',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-white">Terms of Service</h2>
          <p className="text-sm text-slate-400">Last Updated: November 26, 2025</p>
        </ModalHeader>
        <ModalBody>
          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h3>
              <p>
                By accessing and using this political simulation game ("the Game"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
              <p>
                These Terms of Service ("Terms") govern your access to and use of the Game, including any content, functionality, and services offered 
                on or through the Game. By creating an account or using the Game, you agree to these Terms and our Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">2. User Accounts</h3>
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">2.1 Account Creation</h4>
              <p>
                To use the Game, you must create an account by providing accurate, current, and complete information. You are responsible for 
                maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">2.2 Account Uniqueness</h4>
              <p>
                Each user may only create one account. Your username is generated from your first and last name and must be unique. 
                If your chosen name is already taken, you must select a different name combination.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">2.3 Account Security</h4>
              <p>
                You agree to notify us immediately of any unauthorized use of your account. We are not liable for any loss or damage arising 
                from your failure to comply with this security obligation. You may not transfer your account to another person.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">2.4 Account Termination</h4>
              <p>
                We reserve the right to suspend or terminate your account at any time for any reason, including but not limited to violation 
                of these Terms, fraudulent activity, or disruptive behavior that negatively impacts other users' experience.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">3. Game Mechanics and Virtual Economy</h3>
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">3.1 In-Game Currency and Assets</h4>
              <p>
                The Game features virtual currency, companies, assets, and other virtual items. These virtual items have no real-world monetary 
                value and cannot be exchanged for real currency. All virtual items are licensed, not owned, and we reserve the right to modify, 
                manage, or eliminate virtual items at any time.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">3.2 Political Simulation</h4>
              <p>
                The Game is a political and economic simulation. Actions within the Game, including voting on legislation, managing companies, 
                and political campaigns, are entirely fictional and do not represent real-world political positions or endorsements. 
                The Game's content is for entertainment purposes only.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">3.3 Game Balance and Changes</h4>
              <p>
                We reserve the right to rebalance game mechanics, modify features, adjust economic parameters, and make changes to improve 
                gameplay experience. These changes may affect your virtual assets, progress, or strategies. No compensation will be provided 
                for changes made to game balance or mechanics.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">3.4 No Real-World Trading</h4>
              <p>
                Trading, selling, or purchasing in-game items, currency, or accounts for real-world money is strictly prohibited. 
                Violations will result in immediate account termination without refund.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">4. User Conduct and Prohibited Activities</h3>
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">4.1 Acceptable Use</h4>
              <p>You agree to use the Game in accordance with all applicable laws and regulations. You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use offensive, inappropriate, or profane language in usernames, company names, or communications</li>
                <li>Harass, bully, threaten, or abuse other users</li>
                <li>Impersonate other users, staff, or public figures</li>
                <li>Exploit bugs, glitches, or vulnerabilities for unfair advantage</li>
                <li>Use automated scripts, bots, or tools to interact with the Game</li>
                <li>Attempt to hack, reverse engineer, or compromise Game security</li>
                <li>Share your account credentials with others</li>
                <li>Create multiple accounts to circumvent game mechanics</li>
                <li>Engage in market manipulation or collusion to disrupt game economy</li>
                <li>Promote or discuss illegal activities</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">4.2 Content Standards</h4>
              <p>
                All user-generated content (company names, descriptions, communications) must comply with our content standards. 
                Content must not contain profanity, hate speech, discriminatory language, sexual content, violent threats, or illegal content.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">4.3 Enforcement</h4>
              <p>
                Violations of these conduct rules may result in warnings, temporary suspensions, permanent bans, or legal action. 
                We reserve sole discretion in determining what constitutes a violation and the appropriate response.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">5. Intellectual Property Rights</h3>
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">5.1 Our Rights</h4>
              <p>
                The Game and all its content, features, functionality, source code, graphics, logos, and design are owned by us and are 
                protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or 
                lease any part of the Game without our express written permission.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">5.2 User-Generated Content License</h4>
              <p>
                By creating content in the Game (company names, descriptions, messages), you grant us a worldwide, perpetual, irrevocable, 
                royalty-free license to use, reproduce, modify, and display that content in connection with operating and promoting the Game.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">5.3 Trademarks</h4>
              <p>
                Game names, logos, and trademarks are our property. You may not use our trademarks without prior written consent.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">6. Privacy and Data</h3>
              <p>
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. 
                By using the Game, you consent to our data practices as described in the Privacy Policy.
              </p>
              <p>
                We collect information necessary to operate the Game, including account details, gameplay data, and technical information. 
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">7. Disclaimers and Limitations</h3>
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">7.1 No Warranties</h4>
              <p>
                THE GAME IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
                We do not warrant that the Game will be uninterrupted, error-free, secure, or free from viruses or other harmful components.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">7.2 Limitation of Liability</h4>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
                OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, 
                USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE GAME.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">7.3 No Financial Advice</h4>
              <p>
                The Game simulates economic and political systems for entertainment purposes only. Nothing in the Game constitutes financial, 
                investment, legal, or political advice. Do not make real-world decisions based on game mechanics or simulations.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">8. Modifications to Terms and Service</h3>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated 
                Terms with a new "Last Updated" date. Your continued use of the Game after changes constitutes acceptance of the modified Terms.
              </p>
              <p>
                We may also modify, suspend, or discontinue the Game or any features at any time without notice. We are not liable to you 
                or any third party for any modification, suspension, or discontinuance of the Game.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">9. Dispute Resolution</h3>
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">9.1 Informal Resolution</h4>
              <p>
                If you have any disputes with us, you agree to first contact us and attempt to resolve the dispute informally. 
                Most disputes can be resolved this way.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">9.2 Governing Law</h4>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to 
                conflict of law provisions.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">9.3 Arbitration</h4>
              <p>
                Any dispute arising from these Terms or the Game shall be resolved through binding arbitration rather than in court, 
                except that you may assert claims in small claims court if they qualify.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">10. Miscellaneous</h3>
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">10.1 Entire Agreement</h4>
              <p>
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the Game.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">10.2 Severability</h4>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">10.3 Waiver</h4>
              <p>
                Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">10.4 Assignment</h4>
              <p>
                You may not assign or transfer these Terms or your account. We may assign our rights and obligations without restriction.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">11. Contact Information</h3>
              <p>
                If you have questions about these Terms, please contact us through the in-game support system or via email.
              </p>
              <p className="text-sm text-slate-400 italic">
                By creating an account and using the Game, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>

          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="primary"
            onPress={onClose}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
          >
            I Understand
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
