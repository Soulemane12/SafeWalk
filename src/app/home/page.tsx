'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Shield, MapPin, Clock, Users, Zap, Navigation, Eye } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Scrollable content area */}
      <main className="relative z-10 w-full h-full overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-16 pt-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/80 text-sm mb-6 border border-white/20">
              <Shield className="w-4 h-4" />
              Your Safety Companion
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Safe<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">Walk</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed mb-8">
              Navigate the city safely with <span className="text-cyan-300 font-semibold">real-time crime data</span> integration and 
              <span className="text-pink-300 font-semibold"> intelligent route planning</span>.
            </p>
            
            {/* CTA Button */}
            <div className="mb-12">
              <a
                href="/route"
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-10 rounded-2xl text-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105"
              >
                <Navigation className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                Start Your Safe Journey
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </a>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Smart Route Planning */}
            <div className="group bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Smart Route Planning</h3>
              </div>
              <p className="text-gray-200 mb-6 text-lg leading-relaxed">
                Find the optimal path for your journey with advanced algorithms that balance speed and safety seamlessly.
              </p>
              <div className="space-y-3">
                {[
                  'Real-time crime data integration for safer routes',
                  'Multiple transport options: walking, cycling, and driving', 
                  'Fastest route: optimized for shortest distance',
                  'Safest route: intelligently avoids high-crime areas',
                  'Estimated travel time and distance'
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-1 bg-green-400/20 rounded-full mt-1">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-gray-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Features */}
            <div className="group bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Safety Features & History</h3>
              </div>
              <p className="text-gray-200 mb-6 text-lg leading-relaxed">
                Stay informed with comprehensive safety tools and maintain a history of your preferred routes.
              </p>
              <div className="space-y-3">
                {[
                  'Crime heatmap visualization to identify high-density areas',
                  'Community-driven safety ratings (future feature)',
                  'Route history saved locally for easy access',
                  'Clear visual markers for start and end points',
                  'Responsive design for seamless use on any device'
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-1 bg-green-400/20 rounded-full mt-1">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-gray-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="text-center bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
              <div className="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
              <div className="text-gray-300">Real-time Updates</div>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
              <div className="text-4xl font-bold text-pink-400 mb-2">99.9%</div>
              <div className="text-gray-300">Route Accuracy</div>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
              <div className="text-4xl font-bold text-purple-400 mb-2">10K+</div>
              <div className="text-gray-300">Safe Routes Daily</div>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20 mb-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-4 py-2 rounded-full mb-4">
                <Zap className="w-4 h-4" />
                Powered by Modern Tech
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Built with Cutting-Edge Technology</h3>
              <p className="text-gray-200 text-lg max-w-2xl mx-auto">
                SafeWalk leverages the latest technologies to deliver a fast, reliable, and secure experience.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  Frontend Technologies
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'Next.js 14', desc: 'React framework for server-side rendering' },
                    { name: 'TailwindCSS', desc: 'Utility-first CSS framework' },
                    { name: 'Leaflet.js', desc: 'Interactive maps library' },
                    { name: 'TypeScript', desc: 'Static typing for better code quality' }
                  ].map((tech, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2"></div>
                      <div>
                        <span className="text-white font-medium">{tech.name}</span>
                        <span className="text-gray-300">: {tech.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  Data & APIs
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'NYC Open Data', desc: 'Real crime statistics source' },
                    { name: 'OpenStreetMap', desc: 'Detailed map data provider' },
                    { name: 'OSRM API', desc: 'Advanced route calculations' }
                  ].map((tech, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-2"></div>
                      <div>
                        <span className="text-white font-medium">{tech.name}</span>
                        <span className="text-gray-300">: {tech.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg p-12 rounded-3xl border border-white/20">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Navigate Safely?</h3>
            <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust SafeWalk for their daily commute and adventures.
            </p>
            <a
              href="/route"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-10 rounded-2xl text-lg hover:from-green-400 hover:to-emerald-500 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
            >
              <MapPin className="w-5 h-5 group-hover:bounce" />
              Plan Your Route Now
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}