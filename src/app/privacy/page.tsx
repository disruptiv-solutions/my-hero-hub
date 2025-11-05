"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
          <p className="text-gray-400 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
              <p>
                Hero Hub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
              <p className="mb-2">We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Google Account Information:</strong> Email address, name, and profile picture when you sign in with Google</li>
                <li><strong>Calendar Data:</strong> Calendar events, meetings, and scheduling information from your Google Calendar</li>
                <li><strong>Email Data:</strong> Email messages, unread counts, and email metadata from your Gmail account</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our application</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
              <p className="mb-2">We use the collected information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Display your calendar events and meetings in the dashboard</li>
                <li>Show your Gmail inbox and unread email counts</li>
                <li>Provide personalized business command center functionality</li>
                <li>Improve our services and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage</h2>
              <p>
                Your data is stored securely using Firebase Firestore. We store:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Google OAuth access tokens (encrypted in transit and at rest)</li>
                <li>User account information</li>
                <li>Client and business data you create within the application</li>
              </ul>
              <p className="mt-4">
                We do not store the actual content of your emails or calendar events on our servers. We only access this data in real-time through Google APIs to display it in your dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing</h2>
              <p>
                We do not sell, trade, or share your personal information with third parties except:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>As required by law or legal process</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Request deletion of your data</li>
                <li>Revoke Google OAuth access at any time through your Google Account settings</li>
                <li>Disconnect your email accounts through the Profile page</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Security</h2>
              <p>
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Encryption in transit (HTTPS/TLS)</li>
                <li>Secure token storage in Firestore</li>
                <li>Firebase Authentication for secure access</li>
                <li>Regular security audits and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Cookies and Tracking</h2>
              <p>
                We use Firebase Authentication cookies to maintain your session. We do not use third-party tracking cookies or analytics that share your data with advertisers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Children's Privacy</h2>
              <p>
                Our service is not intended for users under the age of 13. We do not knowingly collect information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
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


