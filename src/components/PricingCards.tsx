import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
  packageName: string;
  onPurchase?: (packageName: string) => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  description,
  features,
  buttonText,
  popular = false,
  packageName,
  onPurchase
}) => {
  return (
    <Card className={`relative ${popular ? 'border-primary border-2' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={popular ? "default" : "outline"}
          onClick={() => onPurchase?.(packageName)}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const PricingCards: React.FC = () => {
  const handlePurchase = (packageName: string) => {
    // Mock purchase logic - in real app would integrate with Stripe
    console.log(`Purchasing ${packageName} package`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      <PricingCard
        title="Starter"
        price="$9"
        description="Perfect for trying out AI image generation"
        features={[
          "50 credits per month",
          "Standard quality",
          "Email support",
          "Basic models only"
        ]}
        buttonText="Get Started"
        packageName="starter"
        onPurchase={handlePurchase}
      />

      <PricingCard
        title="Popular"
        price="$29"
        description="Most popular choice for creators"
        features={[
          "150 credits per month",
          "High quality",
          "Priority support",
          "All models included",
          "Commercial usage"
        ]}
        buttonText="Get Started"
        popular={true}
        packageName="popular"
        onPurchase={handlePurchase}
      />

      <PricingCard
        title="Pro"
        price="$99"
        description="For professionals and teams"
        features={[
          "500 credits per month",
          "Ultra high quality",
          "24/7 phone support",
          "All models + beta access",
          "Commercial usage",
          "Team collaboration"
        ]}
        buttonText="Get Started"
        packageName="pro"
        onPurchase={handlePurchase}
      />
    </div>
  );
};
