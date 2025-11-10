"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="mb-6 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="bg-gray-800 border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
          <p className="text-gray-400 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Hero Hub ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p>
                Hero Hub is a business command center dashboard that aggregates and displays:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Calendar events from your Google Calendar</li>
                <li>Email messages from your Gmail account</li>
                <li>Client and business data</li>
                <li>Financial metrics and transactions</li>
                <li>Marketing campaign performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
              <p className="mb-2">To use the Service, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create an account using Google Sign-In</li>
                <li>Grant necessary permissions for Calendar and Gmail access</li>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Permissions and Data Access</h2>
              <p>
                By using Hero Hub, you grant us permission to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Read your Google Calendar events (read-only)</li>
                <li>Read your Gmail messages (read-only)</li>
                <li>Access your Google account email and profile information</li>
                <li>Store OAuth tokens securely for API access</li>
              </ul>
              <p className="mt-4">
                You can revoke these permissions at any time through your Google Account settings or by disconnecting accounts in your Hero Hub profile.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. User Responsibilities</h2>
              <p className="mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the Service only for lawful purposes</li>
                <li>Not attempt to gain unauthorized access to the Service</li>
                <li>Not interfere with or disrupt the Service</li>
                <li>Not use the Service to transmit malicious code or harmful content</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Service Availability</h2>
              <p>
                We strive to provide reliable service but do not guarantee:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Uninterrupted or error-free service</li>
                <li>Immediate availability of all features</li>
                <li>Compatibility with all devices or browsers</li>
              </ul>
              <p className="mt-4">
                We reserve the right to modify, suspend, or discontinue the Service at any time with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
              <p>
                The Service, including its design, features, and content, is protected by copyright and other intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the Service without our written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Data and Content</h2>
              <p>
                You retain ownership of all data and content you provide to the Service. By using the Service, you grant us a limited license to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Store and process your data to provide the Service</li>
                <li>Access your Google Calendar and Gmail data as necessary</li>
                <li>Display your data in the dashboard interface</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Third-Party Services</h2>
              <p>
                Hero Hub integrates with Google services (Calendar, Gmail). Your use of these services is subject to Google's Terms of Service and Privacy Policy. We are not responsible for the availability, accuracy, or practices of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Hero Hub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
              <p className="mt-4">
                You may terminate your account at any time by disconnecting your Google accounts and deleting your data through the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">13. Contact Information</h2>
              <p>
                If you have questions about these Terms, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> [Your Support Email]<br />
                <strong>Website:</strong> [Your Website URL]
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}






