import React from 'react';
import { Page } from '../types';
import { Shield, Activity, BarChart3, HelpCircle } from 'lucide-react';

interface NavigationProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

export default function Navigation({ currentPage, setCurrentPage }: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Branding Logo */}
        <div 
          className="flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-90"
          onClick={() => setCurrentPage('home')}
          id="nav-logo"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600/10 border border-orange-500/30 text-orange-500">
            <Shield className="h-5 w-5" />
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div>
            <span className="font-sans font-bold tracking-wider text-white text-base">
              ROUTE <span className="text-orange-500">RESILIENCE</span>
            </span>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase leading-none mt-0.5">
              AI Urban Road Resilience Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1" aria-label="Tabs" id="nav-tabs">
          <button
            onClick={() => setCurrentPage('home')}
            className={`group relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              currentPage === 'home'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-home"
          >
            Home
            {currentPage === 'home' && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setCurrentPage('pipeline')}
            className={`group relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              currentPage === 'pipeline'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-pipeline"
          >
            <div className="flex items-center space-x-1.5">
              <Activity className="h-4 w-4 text-orange-500/80" />
              <span>Pipeline Demo</span>
            </div>
            {currentPage === 'pipeline' && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`group relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              currentPage === 'dashboard'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-dashboard"
          >
            <div className="flex items-center space-x-1.5">
              <BarChart3 className="h-4 w-4 text-purple-500/80" />
              <span>Dashboard</span>
            </div>
            {currentPage === 'dashboard' && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
        </nav>

        {/* Status indicator */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-slate-400" id="nav-status">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Simulation Engine Ready</span>
        </div>
      </div>
    </header>
  );
}
