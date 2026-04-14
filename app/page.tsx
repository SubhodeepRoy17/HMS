'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  Zap,
  Shield,
  Smartphone,
  ArrowRight,
  Heart,
  Activity,
} from 'lucide-react'
import Link from 'next/link'

export default function Landing() {
  const roles = [
    {
      id: 'doctor',
      name: 'Doctor',
      description: 'Patient care and medical records',
      icon: Stethoscope,
      features: ['Patient consultations', 'Medical records', 'Prescriptions'],
      href: '/auth?role=doctor',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'patient',
      name: 'Patient',
      description: 'Personal health and appointments',
      icon: Users,
      features: ['View appointments', 'Medical history', 'Lab results'],
      href: '/auth?role=patient',
      color: 'from-violet-500 to-purple-500',
    },
    {
      id: 'receptionist',
      name: 'Receptionist',
      description: 'Patient reception and scheduling',
      icon: Clock,
      features: ['Patient check-in', 'Appointment booking', 'Queue management'],
      href: '/auth?role=receptionist',
      color: 'from-rose-500 to-pink-500',
    },
  ]

  const features = [
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'HIPAA compliant with enterprise-grade security',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Real-time updates and instant data processing',
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Seamless experience across all devices',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          25% { transform: scale(1.05); opacity: 0.5; }
          50% { transform: scale(1); opacity: 0.4; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(20px) translateY(-10px); }
          50% { transform: translateX(0px) translateY(-20px); }
          75% { transform: translateX(-20px) translateY(-10px); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.2s ease-in-out infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .animate-drift {
          animation: drift 8s ease-in-out infinite;
        }
      `}</style>

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Central Gradient Orb - represents heart/life */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-full blur-3xl opacity-20 animate-heartbeat" />
        
        {/* Medical Symbol Orbs - floating around */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-15 animate-float" />
        
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full blur-3xl opacity-15 animate-float" style={{ animationDelay: '0.5s' }} />
        
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-bl from-violet-500 to-purple-500 rounded-full blur-3xl opacity-15 animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-15 animate-float" style={{ animationDelay: '1.5s' }} />
        
        {/* Accent Glows */}
        <div className="absolute top-1/4 right-1/3 w-48 h-48 bg-rose-500 rounded-full blur-3xl opacity-10 animate-pulse-glow" />
        
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-cyan-500 rounded-full blur-3xl opacity-10 animate-pulse-glow" style={{ animationDelay: '0.7s' }} />

        {/* Grid Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-500">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MediCare </h1>
                <p className="text-xs text-slate-400">Hospital Management System</p>
              </div>
            </div>
            <Button asChild className="bg-slate-700/50 text-slate-100 border-slate-600 border hover:bg-slate-600 hover:border-slate-500 transition-colors">
              <Link href="/auth">Login</Link>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 mb-6">
              <Activity className="h-4 w-4 text-rose-400 animate-pulse" />
              <span className="text-sm text-slate-300">Advanced Hospital Management</span>
            </div>
            <h2 className="text-6xl sm:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-cyan-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
              Modern Hospital <span className="block">Management System</span>
            </h2>
            <p className="text-xl text-slate-300 text-balance max-w-3xl mx-auto mb-10 leading-relaxed">
              Streamline your hospital operations with our comprehensive management system. Designed for administrators, doctors, patients, and staff with role-based access and real-time data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white gap-2">
                <Link href="/auth">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-slate-700/50 text-slate-100 border-slate-600 border hover:bg-slate-600 hover:border-slate-500 transition-colors">
                <Link href="/learn-more">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <Link key={role.id} href={role.href}>
                  <Card className="h-full bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:shadow-2xl transition-all hover:shadow-slate-900/50 cursor-pointer group backdrop-blur">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${role.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-lg text-white mb-1">{role.name}</h3>
                      <p className="text-sm text-slate-400 mb-4 flex-1">{role.description}</p>
                      <ul className="text-xs space-y-2 mb-6">
                        {role.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-slate-400">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white group-hover:from-slate-600 group-hover:to-slate-500">
                        Get Started
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Features Section */}
          <div id="features" className="grid md:grid-cols-3 gap-8 mb-20 py-16 border-y border-slate-700/50">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="text-center group">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 w-fit mx-auto mb-4 group-hover:from-slate-700 group-hover:to-slate-600 transition-all">
                    <Icon className="h-8 w-8 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-lg text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              )
            })}
          </div>

          {/* CTA Section */}
          <div className="relative rounded-2xl border border-slate-700/50 p-12 text-center overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <h3 className="text-4xl font-bold text-white mb-4">Ready to transform your hospital?</h3>
              <p className="text-slate-400 mb-8 text-lg">
                Choose your role and join thousands of healthcare professionals using MediCare HMS.
              </p>
              <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white">
                <Link href="/auth">
                  Login Now
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-700/50 bg-slate-900/50 mt-20 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-5 w-5 text-rose-500" />
                  <h4 className="font-semibold text-white">MediCare HMS</h4>
                </div>
                <p className="text-sm text-slate-400">Professional hospital management system for modern healthcare.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">Features</Link></li>
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">Pricing</Link></li>
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">Security</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">About</Link></li>
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">Blog</Link></li>
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">Terms & Conditions</Link></li>
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">Compliance</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-700/50 pt-8">
              <p className="text-center text-sm text-slate-500">© 2024 MediCare. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
