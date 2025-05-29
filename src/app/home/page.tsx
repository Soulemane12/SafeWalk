'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-purple-600">
      <main className="h-full overflow-y-auto">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center text-white mb-16 space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">SafeWalk</h1>
            <p className="text-xl max-w-2xl mx-auto">Navigate your city safely with real-time crime data</p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/route">Start Navigating</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="bg-white/10 backdrop-blur-lg text-white border-white/20">
              <CardHeader>
                <CardTitle>Smart Route Planning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Get the safest route to your destination using real-time crime data and community insights.</p>
                <ul className="space-y-2">
                  {[
                    'Real-time crime data integration',
                    'Multiple route options',
                    'Community-driven safety ratings',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-5 h-5 mr-2 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg text-white border-white/20">
              <CardHeader>
                <CardTitle>Safety Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Stay informed and make better decisions about your travel routes.</p>
                <ul className="space-y-2">
                  {[
                    'Crime heatmap visualization',
                    'Safe route recommendations',
                    'Real-time safety updates',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-5 h-5 mr-2 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/10 backdrop-blur-lg text-white border-white/20 max-w-5xl mx-auto mb-16">
            <CardHeader>
              <CardTitle className="text-center text-3xl">Built with Modern Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Frontend Technologies</h3>
                  <ul className="space-y-3">
                    {[
                      { title: 'Next.js 14', desc: 'Modern React framework for server-side rendering and optimal performance' },
                      { title: 'TailwindCSS', desc: 'Utility-first CSS framework for rapid UI development' },
                      { title: 'Leaflet.js', desc: 'Open-source mapping library for interactive maps' },
                    ].map(({ title, desc }, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 mr-2 mt-1 text-green-400" />
                        <div>
                          <span className="font-medium">{title}</span>
                          <p className="text-sm text-gray-200">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Data & APIs</h3>
                  <ul className="space-y-3">
                    {[
                      { title: 'NYC Open Data', desc: 'Real-time NYPD crime data integration' },
                      { title: 'OpenStreetMap', desc: 'Free and open geographic data' },
                      { title: 'OSRM API', desc: 'Open Source Routing Machine for route calculations' },
                    ].map(({ title, desc }, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 mr-2 mt-1 text-green-400" />
                        <div>
                          <span className="font-medium">{title}</span>
                          <p className="text-sm text-gray-200">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">Key Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Smart Routing', desc: 'AI-powered route optimization considering crime data and safety factors' },
                  { title: 'Real-time Updates', desc: 'Live crime data integration with automatic route recalculation' },
                  { title: 'User-Friendly', desc: 'Intuitive interface with easy-to-understand safety indicators' },
                ].map(({ title, desc }, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-medium mb-2">{title}</h4>
                    <p className="text-sm text-gray-200">{desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
