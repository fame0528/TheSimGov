/**
 * @fileoverview Privacy Policy Modal
 * @module components/legal/PrivacyPolicyModal
 * 
 * OVERVIEW:
 * Modal component displaying complete Privacy Policy for the political simulation game.
 * Comprehensive data privacy document covering collection, usage, storage, and user rights.
 * 
 * @created 2025-11-26
 * @author ECHO v1.3.0
 */

'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * PrivacyPolicyModal - Complete privacy policy in scrollable modal
 * 
 * @param isOpen - Modal visibility state
 * @param onClose - Function to close modal
 * @returns Privacy Policy modal component
 */
export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
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
          <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
          <p className="text-sm text-slate-400">Last Updated: November 26, 2025</p>
        </ModalHeader>
        <ModalBody>
          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300">
            
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">1. Introduction</h3>
              <p>
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our political 
                simulation game ("the Game"). Please read this privacy policy carefully. If you do not agree with the terms of this 
                privacy policy, please do not access the Game.
              </p>
              <p>
                We respect your privacy and are committed to protecting your personal information. This policy describes what information 
                we collect, how we use it, and your rights regarding that information.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h3>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">2.1 Personal Information You Provide</h4>
              <p>When you create an account, we collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Name:</strong> First name and last name for account identification and username generation</li>
                <li><strong>Email Address:</strong> For account verification, communications, and password recovery</li>
                <li><strong>Password:</strong> Stored securely using industry-standard bcrypt hashing (we cannot see your actual password)</li>
                <li><strong>State:</strong> Your selected home state for game mechanics and regional features</li>
                <li><strong>Username:</strong> Auto-generated from your first and last name</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">2.2 Gameplay Information</h4>
              <p>During gameplay, we automatically collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Game Progress:</strong> Companies owned, assets, virtual currency, political positions, voting history</li>
                <li><strong>In-Game Actions:</strong> Legislation votes, company transactions, political campaigns, lobbying activities</li>
                <li><strong>User-Generated Content:</strong> Company names, descriptions, messages, and other content you create</li>
                <li><strong>Session Data:</strong> Login times, last activity timestamps, session duration</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">2.3 Technical Information</h4>
              <p>We automatically collect technical data when you use the Game:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
                <li><strong>IP Address:</strong> For security, fraud prevention, and approximate location</li>
                <li><strong>Cookies and Similar Technologies:</strong> Session tokens, authentication tokens, preference settings</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
                <li><strong>Performance Data:</strong> Error logs, crash reports, loading times</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">2.4 Geolocation Data (Optional)</h4>
              <p>
                With your permission, we may access your device's geolocation to suggest your home state during registration. 
                This feature is entirely optional and can be declined. We do not continuously track your location.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h3>
              <p>We use the information we collect to:</p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">3.1 Provide and Maintain the Game</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create and manage your account</li>
                <li>Authenticate your identity and maintain session security</li>
                <li>Save your game progress and settings</li>
                <li>Process in-game transactions and actions</li>
                <li>Enable gameplay features and mechanics</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">3.2 Improve User Experience</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Analyze gameplay patterns to balance game mechanics</li>
                <li>Identify and fix bugs and technical issues</li>
                <li>Develop new features based on user behavior</li>
                <li>Optimize performance and loading times</li>
                <li>Personalize your experience with saved preferences</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">3.3 Communication</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Send important account notifications (security alerts, policy changes)</li>
                <li>Respond to your support requests and feedback</li>
                <li>Send game updates and announcements (if you opt in)</li>
                <li>Facilitate password recovery and account verification</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">3.4 Security and Fraud Prevention</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Detect and prevent cheating, exploitation, or abuse</li>
                <li>Identify suspicious account activity</li>
                <li>Enforce our Terms of Service</li>
                <li>Protect against unauthorized access</li>
                <li>Maintain platform integrity and fair gameplay</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">3.5 Legal Compliance</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Comply with applicable laws and regulations</li>
                <li>Respond to legal requests and prevent illegal activity</li>
                <li>Enforce our legal rights and terms</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">4. Information Sharing and Disclosure</h3>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">4.1 We DO NOT Sell Your Data</h4>
              <p>
                We do not sell, rent, or trade your personal information to third parties for their marketing purposes. 
                Your data is not a product we monetize.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">4.2 Service Providers</h4>
              <p>
                We may share information with trusted third-party service providers who assist us in operating the Game:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Database Hosting:</strong> MongoDB Atlas for secure data storage</li>
                <li><strong>Authentication:</strong> NextAuth.js for account security</li>
                <li><strong>Analytics:</strong> Aggregate usage statistics (anonymized)</li>
              </ul>
              <p>
                These providers are contractually obligated to protect your information and may only use it to provide services to us.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">4.3 Legal Requirements</h4>
              <p>We may disclose your information if required to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Comply with legal obligations, court orders, or government requests</li>
                <li>Enforce our Terms of Service or investigate violations</li>
                <li>Protect the rights, property, or safety of our users or the public</li>
                <li>Detect, prevent, or address fraud, security, or technical issues</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">4.4 Business Transfers</h4>
              <p>
                If we are involved in a merger, acquisition, or sale of assets, your information may be transferred. 
                We will notify you of any such change and provide options regarding your information.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">4.5 Public Information</h4>
              <p>
                Some information is visible to other users by design:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your username (generated from your name)</li>
                <li>Your home state</li>
                <li>Company names and descriptions you create</li>
                <li>Your political positions and voting records (part of game mechanics)</li>
                <li>Leaderboard rankings (if applicable)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">5. Data Security</h3>
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Encryption:</strong> Data encrypted in transit (HTTPS/TLS) and at rest</li>
                <li><strong>Password Protection:</strong> Passwords hashed with bcrypt (cost factor 12)</li>
                <li><strong>Access Controls:</strong> Limited employee access to personal data on need-to-know basis</li>
                <li><strong>Secure Authentication:</strong> JWT tokens with expiration for session management</li>
                <li><strong>Regular Updates:</strong> Security patches and vulnerability monitoring</li>
                <li><strong>Database Security:</strong> MongoDB Atlas with network isolation and access control</li>
              </ul>
              <p>
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect 
                your personal information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">6. Data Retention</h3>
              <p>
                We retain your personal information for as long as necessary to provide the Game and fulfill the purposes outlined in this policy:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                <li><strong>Deleted Accounts:</strong> Personal data deleted within 30 days of account deletion request</li>
                <li><strong>Legal Obligations:</strong> Some data may be retained longer to comply with legal requirements</li>
                <li><strong>Backup Systems:</strong> Data in backups deleted according to our backup retention schedule (90 days)</li>
                <li><strong>Anonymized Data:</strong> Aggregated, anonymized statistics may be retained indefinitely for analysis</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">7. Your Privacy Rights</h3>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">7.1 Access and Portability</h4>
              <p>
                You have the right to request a copy of the personal information we hold about you. You can export your game data 
                through your account settings.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">7.2 Correction</h4>
              <p>
                You can update your account information (email, password) through account settings. If you need to change your name, 
                please contact support.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">7.3 Deletion</h4>
              <p>
                You can request deletion of your account and personal information at any time. This will permanently delete your account, 
                game progress, and associated data. This action cannot be undone.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">7.4 Opt-Out of Communications</h4>
              <p>
                You can opt out of non-essential communications (newsletters, updates) through account settings or by using unsubscribe 
                links in emails. You cannot opt out of essential service communications (security alerts, policy changes).
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">7.5 Cookie Management</h4>
              <p>
                You can control cookies through your browser settings. Note that disabling cookies may affect Game functionality, 
                particularly authentication and session management.
              </p>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">7.6 GDPR Rights (EU Users)</h4>
              <p>
                If you are located in the European Economic Area, you have additional rights under GDPR:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to object to processing</li>
                <li>Right to data portability</li>
                <li>Right to lodge a complaint with supervisory authority</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-emerald-400 mb-2">7.7 CCPA Rights (California Users)</h4>
              <p>
                California residents have specific rights under the California Consumer Privacy Act:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Right to know what personal information is collected</li>
                <li>Right to know if personal information is sold or disclosed</li>
                <li>Right to say no to the sale of personal information (we don't sell data)</li>
                <li>Right to access your personal information</li>
                <li>Right to deletion of personal information</li>
                <li>Right to equal service and price (no discrimination)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">8. Children's Privacy</h3>
              <p>
                The Game is not intended for children under the age of 13. We do not knowingly collect personal information from children 
                under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact 
                us immediately. We will delete such information from our systems.
              </p>
              <p>
                Users between 13 and 18 years old should have parental consent before using the Game.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">9. International Data Transfers</h3>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. These countries 
                may have different data protection laws. We take steps to ensure your information receives adequate protection wherever 
                it is processed.
              </p>
              <p>
                By using the Game, you consent to the transfer of your information to our servers and service providers located globally.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">10. Third-Party Links</h3>
              <p>
                The Game may contain links to third-party websites or services. We are not responsible for the privacy practices of these 
                third parties. We encourage you to read the privacy policies of any third-party sites you visit.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">11. Changes to Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Posting the updated policy with a new "Last Updated" date</li>
                <li>Sending an email notification for significant changes</li>
                <li>Displaying an in-game notification</li>
              </ul>
              <p>
                Your continued use of the Game after changes constitutes acceptance of the updated Privacy Policy. 
                We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">12. Contact Us</h3>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Through the in-game support system</li>
                <li>By email (provide email address)</li>
                <li>Through your account settings for data access/deletion requests</li>
              </ul>
              <p>
                We will respond to your request within 30 days.
              </p>
            </section>

            <section className="border-t border-white/10 pt-6 mt-6">
              <p className="text-sm text-slate-400 italic">
                By creating an account and using the Game, you acknowledge that you have read, understood, and agree to this Privacy Policy. 
                You consent to the collection, use, and disclosure of your information as described herein.
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
