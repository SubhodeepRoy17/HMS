'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Heart,
  Stethoscope,
  Users,
  Clock,
  BarChart3,
  Shield,
  Zap,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Lock,
  Database,
  AlertCircle,
  TrendingUp,
  Activity,
  Pill,
} from 'lucide-react'
import Link from 'next/link'

export default function LearnMore() {
  const features = [
    {
      icon: Stethoscope,
      title: 'Patient Management',
      description: 'Complete patient records management system with medical history, appointments, and treatment plans.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Clock,
      title: 'Appointment Scheduling',
      description: 'Intelligent appointment booking system with automatic conflict detection and reminders.',
      color: 'from-sky-500 to-cyan-500',
    },
    {
      icon: Pill,
      title: 'Prescription Management',
      description: 'Digital prescription system with drug interaction checks and automated refill tracking.',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Database,
      title: 'Medical Records',
      description: 'Secure, centralized medical records with full audit trails and version control.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: TrendingUp,
      title: 'Analytics Dashboard',
      description: 'Real-time analytics with patient statistics, department performance, and system insights.',
      color: 'from-orange-500 to-amber-500',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Seamless communication between doctors, nurses, and administrative staff.',
      color: 'from-blue-500 to-indigo-500',
    },
  ]

  const roles = [
    {
      title: 'Administrator',
      icon: BarChart3,
      responsibilities: [
        'User and access management',
        'System configuration and settings',
        'Department management',
        'Analytics and reporting',
        'Billing and invoicing',
      ],
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Doctor',
      icon: Stethoscope,
      responsibilities: [
        'Patient consultations',
        'Prescriptions and medications',
        'Medical records management',
        'Appointment scheduling',
        'Patient diagnosis',
      ],
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Patient',
      icon: Users,
      responsibilities: [
        'Book appointments',
        'View medical history',
        'Check lab results',
        'Download prescriptions',
        'Communicate with doctors',
      ],
      color: 'from-violet-500 to-purple-500',
    },
    {
      title: 'Receptionist',
      icon: Clock,
      responsibilities: [
        'Patient check-in',
        'Appointment scheduling',
        'Queue management',
        'Patient records lookup',
        'Call routing',
      ],
      color: 'from-rose-500 to-pink-500',
    },
  ]

  const benefits = [
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'HIPAA compliant with enterprise-grade encryption and security protocols.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Real-time updates and instant data processing for immediate access.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Fully responsive design works seamlessly on all devices.',
    },
    {
      icon: Lock,
      title: 'Data Protection',
      description: 'Advanced encryption, automated backups, and disaster recovery plans.',
    },
    {
      icon: TrendingUp,
      title: 'Scalable',
      description: 'Grows with your hospital - from clinic to enterprise healthcare.',
    },
    {
      icon: Activity,
      title: '24/7 Support',
      description: 'Round-the-clock technical support and system monitoring.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-rose-500/15 to-pink-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-bl from-violet-500/15 to-purple-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-500">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MediCare HMS</h1>
                <p className="text-xs text-slate-400">Learn More</p>
              </div>
            </div>
            <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
              <Link href="/auth">Get Started</Link>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 mb-8">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <span className="text-sm text-slate-300">Comprehensive Healthcare Solution</span>
            </div>
            <h2 className="text-6xl sm:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-r from-cyan-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
              Advanced Hospital Management
            </h2>
            <p className="text-xl text-slate-300 text-balance max-w-3xl mx-auto">
              MediCare HMS is a comprehensive hospital management system designed to streamline operations, improve patient care, and enhance administrative efficiency across all departments and roles.
            </p>
          </div>

          {/* Core Features Grid */}
          <section className="mb-24">
            <h3 className="text-3xl font-bold text-white mb-12 text-center">Core Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon
                return (
                  <Card key={idx} className="bg-slate-800/40 border-slate-700/50 hover:border-slate-600 transition-all hover:shadow-2xl hover:shadow-slate-900/50 backdrop-blur group">
                    <CardContent className="p-8">
                      <div className={`p-4 rounded-lg bg-gradient-to-br ${feature.color} w-fit mb-6 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-3">{feature.title}</h4>
                      <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Role Overview */}
          <section className="mb-24 py-16 border-y border-slate-700/50">
            <h3 className="text-3xl font-bold text-white mb-12 text-center">Role-Based Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {roles.map((role, idx) => {
                const Icon = role.icon
                return (
                  <Card key={idx} className="bg-slate-800/40 border-slate-700/50 hover:border-slate-600 transition-all backdrop-blur group">
                    <CardContent className="p-8">
                      <div className={`p-4 rounded-lg bg-gradient-to-br ${role.color} w-fit mb-6 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-6">{role.title}</h4>
                      <ul className="space-y-3">
                        {role.responsibilities.map((resp, ridx) => (
                          <li key={ridx} className="flex items-start gap-3 text-slate-400">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Benefits Section */}
          <section className="mb-24">
            <h3 className="text-3xl font-bold text-white mb-12 text-center">Why Choose MediCare HMS?</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon
                return (
                  <div key={idx} className="group">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-700/50 group-hover:border-slate-600 transition-all mb-6">
                      <Icon className="h-8 w-8 text-cyan-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-3">{benefit.title}</h4>
                    <p className="text-slate-400 leading-relaxed">{benefit.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-24">
            <h3 className="text-3xl font-bold text-white mb-12 text-center">How It Works</h3>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {[
                  {
                    step: 1,
                    title: 'Registration',
                    description: 'Sign up with your role (Admin, Doctor, Patient, or Receptionist) and complete your profile.',
                  },
                  {
                    step: 2,
                    title: 'Authentication',
                    description: 'Secure login with role-based access control and encrypted credentials.',
                  },
                  {
                    step: 3,
                    title: 'Dashboard Access',
                    description: 'Access your personalized dashboard with tools specific to your role.',
                  },
                  {
                    step: 4,
                    title: 'Operations',
                    description: 'Perform role-specific tasks like appointments, records management, and analytics.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                        {item.step}
                      </div>
                      {idx < 3 && <div className="w-1 h-16 bg-gradient-to-b from-cyan-500/50 to-transparent mt-2" />}
                    </div>
                    <div className="pt-2 pb-6">
                      <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-slate-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Security & Privacy */}
          <section className="relative rounded-2xl border border-slate-700/50 p-12 text-center overflow-hidden mb-24 group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <Lock className="h-12 w-12 text-cyan-400 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-white mb-4">Enterprise Security</h3>
              <p className="text-slate-400 max-w-2xl mx-auto mb-8">
                Your data is protected with industry-leading encryption, secure authentication, regular security audits, and full HIPAA compliance. We maintain strict privacy standards and comprehensive backup systems.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {['End-to-End Encryption', 'HIPAA Compliant', 'Daily Backups'].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-center gap-2 p-3 bg-slate-700/20 rounded-lg border border-slate-600/50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative rounded-2xl border border-slate-700/50 p-12 text-center overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <h3 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Hospital?</h3>
              <p className="text-slate-400 mb-10 text-lg max-w-2xl mx-auto">
                Join healthcare providers worldwide who trust MediCare HMS for their hospital management needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                  <Link href="/auth">
                    Get Started Now
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-100 hover:bg-slate-800">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </section>
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
                  <li><Link href="/learn-more" className="hover:text-slate-300 transition-colors">Features</Link></li>
                  <li><Link href="/auth" className="hover:text-slate-300 transition-colors">Get Started</Link></li>
                  <li><Link href="/" className="hover:text-slate-300 transition-colors">Security</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/" className="hover:text-slate-300 transition-colors">About</Link></li>
                  <li><Link href="/" className="hover:text-slate-300 transition-colors">Blog</Link></li>
                  <li><Link href="/" className="hover:text-slate-300 transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/" className="hover:text-slate-300 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/" className="hover:text-slate-300 transition-colors">Terms & Conditions</Link></li>
                  <li><Link href="/" className="hover:text-slate-300 transition-colors">Compliance</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-700/50 pt-8">
              <p className="text-center text-sm text-slate-500">© 2024 MediCare HMS. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
