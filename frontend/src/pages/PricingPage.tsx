import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["5 prompts per day", "All programming languages", "Download as .txt / .py", "Basic prompt history", "Community support"],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    features: ["Unlimited prompts", "All programming languages", "PDF export", "Priority AI generation", "Full prompt history", "Priority support", "Early access to new features"],
    cta: "Upgrade to Pro",
    highlight: true,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-4xl font-bold text-foreground md:text-5xl">
          Choose Your <span className="text-gradient">Plan</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Start free with 5 prompts daily. Upgrade for unlimited power.
        </p>
      </motion.div>

      <div className="mx-auto mt-16 grid max-w-3xl gap-8 md:grid-cols-2">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`relative rounded-xl border p-8 ${
              plan.highlight ? "border-primary/50 bg-card glow" : "border-border/50 bg-card"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                Most Popular
              </div>
            )}
            <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-black text-foreground">{plan.price}</span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className={`mt-8 w-full ${
                plan.highlight
                  ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              onClick={() => navigate("/register")}
            >
              {plan.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
