'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PricingCards } from '@/components/PricingCards';
import { MockCheckout } from '@/components/MockCheckout';
import { UserSidebar } from '@/components/UserSidebar';
import { getUser, getCredits } from '@/lib/mockAuth';

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<{
    name: string;
    credits: number;
    price: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      setCredits(getCredits());
    }
  }, []);

  const handlePurchase = (packageName: string) => {
    const packages = {
      starter: { name: 'Starter', credits: 50, price: '$9' },
      popular: { name: 'Popular', credits: 150, price: '$29' },
      pro: { name: 'Pro', credits: 500, price: '$99' }
    };

    setSelectedPackage(packages[packageName as keyof typeof packages]);
  };

  return (
    <>
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <div className="ml-64 min-h-screen pt-16 p-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get more credits to continue creating amazing AI images. All plans include our core features.
          </p>
        </div>

        {/* Current Credits Display */}
        {user && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium">
                Current Credits: {credits}
              </span>
            </div>
          </div>
        )}

        <PricingCards />

        {/* FAQ Section */}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-2">How do credits work?</h3>
              <p className="text-muted-foreground">
                Each image generation uses credits based on the model you choose.
                FLUX.1 Schnell uses 1 credit, FLUX.1 Pro uses 2 credits, and FLUX.1 Dev uses 3 credits.
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll retain access to your purchased credits until they're used up.
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards and PayPal. All payments are processed securely through our payment partners.
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-2">Do credits expire?</h3>
              <p className="text-muted-foreground">
                Credits don't expire as long as you have an active account. Use them whenever you're ready to create!
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 text-center">
          <div className="bg-muted/30 rounded-2xl p-8 lg:p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Create More?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of creators who trust AI Maven for their visual content needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/generate">
                <Button size="lg">
                  Start Generating
                </Button>
              </Link>
              <Link href="/gallery">
                <Button variant="outline" size="lg">
                  View Gallery
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Checkout Modal */}
        <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="sr-only">
                Complete Purchase
              </DialogTitle>
            </DialogHeader>
            {selectedPackage && (
              <MockCheckout
                packageName={selectedPackage.name}
                credits={selectedPackage.credits}
                price={selectedPackage.price}
                onClose={() => setSelectedPackage(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
