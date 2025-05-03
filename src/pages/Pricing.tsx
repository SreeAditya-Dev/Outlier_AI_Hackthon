import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Footer from '@/components/Footer';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Info } from 'lucide-react';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const plans = [
    {
      name: "Starter",
      monthlyPrice: "₹9,999",
      yearlyPrice: "₹99,990",
      yearlyDiscount: "₹19,998 savings",
      description: "Perfect for small businesses with limited routes",
      features: [
        "Up to 5 vehicles",
        "Basic route optimization",
        "Daily traffic updates",
        "Email support",
        "7-day route history"
      ],
      popular: false,
      buttonText: "Get Started",
    },
    {
      name: "Pro",
      monthlyPrice: "₹24,999",
      yearlyPrice: "₹249,990",
      yearlyDiscount: "₹49,998 savings",
      description: "For growing businesses with moderate logistics needs",
      features: [
        "Up to 25 vehicles",
        "Advanced route optimization",
        "Real-time traffic integration",
        "Toll cost optimization",
        "Priority support",
        "30-day route history",
        "Basic analytics dashboard"
      ],
      popular: true,
      buttonText: "Get Started",
    },
    {
      name: "Enterprise",
      monthlyPrice: "Custom",
      yearlyPrice: "Custom",
      yearlyDiscount: "Contact sales for special annual discounts",
      description: "For large fleets with complex routing requirements",
      features: [
        "Unlimited vehicles",
        "Premium route optimization",
        "Real-time dynamic rerouting",
        "Advanced analytics & reporting",
        "Dedicated account manager",
        "API access",
        "Custom integrations",
        "90-day route history"
      ],
      popular: false,
      buttonText: "Contact Sales",
    }
  ];

  const faqs = [
    {
      question: "How accurate is your traffic data?",
      answer: "Our traffic data is sourced from multiple reliable providers including MapmyIndia, Google Maps, and crowd-sourced information. We update traffic conditions every 2-5 minutes in major cities and every 15 minutes in other areas."
    },
    {
      question: "Does your platform work offline?",
      answer: "Yes, our mobile app allows drivers to download routes for offline use. While real-time updates won't be available without connectivity, the basic navigation features will continue to work."
    },
    {
      question: "Can I integrate with my existing fleet management software?",
      answer: "Yes, our Enterprise plan includes API access and custom integrations with major fleet management solutions. Our team will work with you to ensure smooth data flow between systems."
    },
    {
      question: "How do you calculate toll costs?",
      answer: "We maintain a comprehensive database of toll plazas across India, with up-to-date pricing based on vehicle types. Our system calculates toll costs as part of the route optimization process, allowing you to choose routes based on time, distance, or total cost including tolls."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes, we offer a 14-day free trial of our Pro plan so you can experience the benefits of Last Mile before committing. No credit card is required to start your trial."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-6 md:pt-8 pb-16 md:pb-24 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_10%,rgba(255,255,255,0)_40%,rgba(102,51,238,1)_100%)]"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Clear, <span className='text-logistics-600 font-semibold'>Transparent</span> Pricing for Everyone
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Choose the plan that's right for your logistics needs, with no hidden fees or long-term commitments.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-12 md:py-16 px-4 bg-gray">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-center mb-8">
            <div className="bg-gray-300 p-1 rounded-full flex items-center">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  billingCycle === 'monthly'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  billingCycle === 'yearly'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600'
                }`}
              >
                Yearly <span className="text-logistics-600 font-semibold">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`overflow-hidden ${
                  plan.popular
                    ? 'border-logistics-600 shadow-lg relative'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-logistics-600 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                <CardHeader className="pb-0">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="mt-1">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <p className="text-4xl font-bold text-gray-900">
                      {billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                      {typeof plan.monthlyPrice === 'string' && plan.monthlyPrice !== 'Custom' && (
                        <span className="text-sm font-normal text-gray-500">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
                    </p>
                    {billingCycle === 'yearly' && plan.yearlyDiscount && (
                      <p className="text-sm text-logistics-600 mt-1">{plan.yearlyDiscount}</p>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-logistics-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-logistics-600 hover:bg-logistics-700'
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                    asChild
                  >
                    <Link to="/auth">{plan.buttonText}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-12 md:py-16 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_10%,rgba(255,255,255,0)_40%,rgba(102,51,238,1)_100%)] opacity-30"></div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about our pricing and services
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex justify-between items-center w-full p-6 text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                  <div className="ml-4">
                    {openFaqIndex === index ? (
                      <Minus className="h-5 w-5 text-logistics-600" />
                    ) : (
                      <Plus className="h-5 w-5 text-logistics-600" />
                    )}
                  </div>
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Still have questions?</p>
            <Button size="lg" asChild>
              <Link to="/contact">Contact Our Team</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
