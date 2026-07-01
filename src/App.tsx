/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import PipelineDemoView from './components/PipelineDemoView';
import DashboardView from './components/DashboardView';
import { Page } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Animation variants for page-level transitions
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: 'easeIn' } }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* Top sticky navigation bar */}
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Main content view with transition container */}
      <main className="flex-grow relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full"
          >
            {currentPage === 'home' && (
              <HomeView setCurrentPage={setCurrentPage} />
            )}
            
            {currentPage === 'pipeline' && (
              <PipelineDemoView setCurrentPage={setCurrentPage} />
            )}
            
            {currentPage === 'dashboard' && (
              <DashboardView />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modern micro-footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs font-mono text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 Route Resilience Framework. Earth Observation &amp; Graph Analytics Division.</span>
          <div className="flex space-x-4">
            <span className="hover:text-slate-300 cursor-help transition-colors">Documentation</span>
            <span>&bull;</span>
            <span className="hover:text-slate-300 cursor-help transition-colors">API Specs</span>
            <span>&bull;</span>
            <span className="hover:text-slate-300 cursor-help transition-colors">Security Rules</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
