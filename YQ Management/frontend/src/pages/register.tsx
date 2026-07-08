import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';

export default function Register() {
  return (
    <div className="min-h-screen bg-black text-white flex">
      <Head>
        <title>Sign Up | YQ Queue</title>
      </Head>

      {/* Left Panel - Visual */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-zinc-950 items-center justify-center border-r border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-900/30 via-transparent to-transparent opacity-60"></div>
        
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob"></div>
        <div className="absolute bottom-0 -left-4 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 max-w-md p-12">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-600 flex items-center justify-center font-bold text-white text-xl shadow-[0_0_25px_rgba(236,72,153,0.5)] mb-8">
            YQ
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
            Start orchestrating your spaces today.
          </h2>
          <p className="text-lg text-zinc-400">
            Join hundreds of businesses delivering seamless waiting experiences to their customers.
          </p>
          
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-zinc-300">14-day free trial</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-zinc-300">No credit card required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-600 flex items-center justify-center font-bold text-white mb-8 shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            YQ
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-zinc-400 mb-8">Let's get you set up. It only takes a minute.</p>

          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="email" 
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="you@company.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="password" 
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Create a strong password"
                />
              </div>
            </div>

            {/* Note: We redirect to onboarding after this form is submitted! */}
            <button 
              type="button" 
              onClick={() => window.location.href = '/onboarding'}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 transition-colors mt-8"
            >
              Continue to Setup
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-zinc-500">Or sign up with</span>
            </div>
          </div>

          <div className="mt-8">
            <a 
              href="http://localhost:3000/auth/google" 
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-zinc-900 border border-white/10 rounded-xl hover:bg-zinc-800 transition-colors font-medium text-zinc-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </a>
          </div>

          <p className="mt-10 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
