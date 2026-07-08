import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowRight, 
  Smartphone, 
  Monitor, 
  MessageSquare, 
  Clock, 
  QrCode, 
  TrendingUp, 
  CheckCircle2, 
  Users 
} from 'lucide-react';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function LandingPage() {
  return (
    <div className={`min-h-screen bg-black text-zinc-50 ${geistSans.className} overflow-hidden`}>
      <Head>
        <title>YQ Queue | Eliminate Waiting. Elevate Experience.</title>
        <meta name="description" content="White-label B2B SaaS Queue Management Platform" />
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              YQ
            </div>
            <span className="text-xl font-bold tracking-tight">Queue</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] opacity-30 pointer-events-none">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm font-medium text-zinc-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            YQ Queue 2.0 is now live
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
            Eliminate Waiting.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Elevate Experience.
            </span>
          </h1>
          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The white-label queue orchestration platform that turns physical lines into seamless digital experiences. Delight your customers and optimize your operations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black text-lg font-medium hover:scale-105 transition-transform"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/admin" 
              className="flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-lg font-medium transition-colors backdrop-blur-sm"
            >
              View Admin Demo
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-zinc-950 px-6 relative border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Wait is Over</h2>
            <p className="text-zinc-400">Three simple steps to a friction-free customer journey.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <QrCode className="w-8 h-8 text-indigo-400" />,
                title: "1. Scan & Join",
                desc: "Customers simply scan a QR code at your location or join via your website. No apps required."
              },
              {
                icon: <Smartphone className="w-8 h-8 text-purple-400" />,
                title: "2. Track Live",
                desc: "They receive a digital ticket on their phone with real-time ETA and position tracking."
              },
              {
                icon: <CheckCircle2 className="w-8 h-8 text-pink-400" />,
                title: "3. Get Served",
                desc: "They are notified via WhatsApp or SMS the moment it's their turn."
              }
            ].map((step, i) => (
              <div key={i} className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-colors group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Everything you need to <br/>orchestrate crowds.</h2>
            <p className="text-xl text-zinc-400 max-w-2xl">A complete suite of tools designed to handle walk-ins, appointments, and everything in between.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
            {/* Feature 1 */}
            <div className="md:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <Monitor className="w-10 h-10 text-zinc-300" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Digital Signage (TV)</h3>
                  <p className="text-zinc-400">Cast beautiful, high-contrast queue lists to any smart TV in your waiting room. Updates instantly via WebSockets.</p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <MessageSquare className="w-10 h-10 text-zinc-300" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">WhatsApp Webhooks</h3>
                  <p className="text-zinc-400">Two-way messaging. Users can reply 'LATE' to step back.</p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <Clock className="w-10 h-10 text-zinc-300" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Hybrid System</h3>
                  <p className="text-zinc-400">Merge walk-ins and pre-booked appointments into one flow.</p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="md:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <TrendingUp className="w-10 h-10 text-zinc-300" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">AI-Powered Wait Times</h3>
                  <p className="text-zinc-400">Our engine calculates real-time throughput based on the last 10 served customers, providing hyper-accurate ETAs to those waiting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-500/10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to transform your waiting experience?</h2>
          <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">Join hundreds of businesses using YQ Queue to manage their physical spaces intelligently.</p>
          <Link 
            href="/register" 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black text-lg font-medium hover:scale-105 transition-transform"
          >
            Start your free trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
              YQ
            </div>
            <span className="text-lg font-bold tracking-tight">Queue</span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500">
            <Link href="/login" className="hover:text-white transition-colors">Admin Login</Link>
            <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-sm text-zinc-600">© 2026 YQ Queue Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
