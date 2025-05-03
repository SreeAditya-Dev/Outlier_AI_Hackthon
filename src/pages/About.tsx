
import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Route, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { DirectionAwareHover } from '@/components/ui/direction-aware-hover';

const AboutPage = () => {
  const stats = [
    { value: '10,000+', label: 'Active Users' },
    { value: '25+', label: 'Major Cities Covered' },
    { value: '5,000+', label: 'Routes Optimized Daily' },
    { value: '15%', label: 'Average Fuel Savings' },
  ];

  const team = [
    {
      name: 'Aarav Patel',
      role: 'Founder & CEO',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      bio: 'Former logistics exec with 15+ years in the Indian transportation industry.',
    },
    {
      name: 'Neha Sharma',
      role: 'CTO',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      bio: 'AI specialist with expertise in route optimization algorithms.',
    },
    {
      name: 'Vikram Singh',
      role: 'Head of Operations',
      image: 'https://randomuser.me/api/portraits/men/54.jpg',
      bio: 'Former fleet manager who understands the challenges of Indian logistics.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="pt-6 md:pt-8 pb-16 md:pb-24 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_10%,rgba(255,255,255,0)_40%,rgba(102,51,238,1)_100%)]"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              About <span className="text-logistics-600">Last Mile</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              We're building the future of freight logistics in India with advanced technology and deep industry knowledge.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <DirectionAwareHover
                imageUrl="https://images.unsplash.com/photo-1616432043562-3671ea2e5242?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                className="w-full h-80 md:h-96"
                imageClassName="object-cover"
              >
                <h3 className="text-xl font-bold">Our Journey</h3>
                <p className="text-sm">Since 2025</p>
              </DirectionAwareHover>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Story</h2>
              <div className="space-y-4 text-black">
                <p>
                  Founded in 2025, Last Mile was born from a simple observation: India's logistics sector was struggling with inefficient routing that cost companies millions in wasted fuel and time.
                </p>
                <p>
                  Our founder, who spent years in the transportation industry, saw firsthand how the unique challenges of Indian roads, traffic patterns, and regulatory environment created complications that global solutions weren't addressing.
                </p>
                <p>
                  We set out to build a solution specifically for India's cargo transportation challenges, combining advanced route optimization with local knowledge of roads, tolls, and traffic patterns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-logistics-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Our Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Meet the experts building India's most advanced logistics optimization platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-gray-700 rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <DirectionAwareHover
                    imageUrl={member.image}
                    className="w-full h-64"
                    imageClassName="object-cover object-center"
                  >
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-sm">{member.role}</p>
                  </DirectionAwareHover>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-1 text-gray-900">{member.name}</h3>
                  <p className="text-logistics-600 mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-logistics-600 text-white">
        <div className="container mx-auto max-w-7xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join the Last Mile Revolution</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Be part of India's fastest-growing logistics optimization platform.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth">Get Started Now</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
