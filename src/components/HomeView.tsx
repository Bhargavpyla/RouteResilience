import React from 'react';
import { Page } from '../types';
import { motion } from 'motion/react';
import { ArrowRight, Eye, RefreshCw, Zap, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HomeViewProps {
  setCurrentPage: (page: Page) => void;
}

export default function HomeView({ setCurrentPage }: HomeViewProps) {
  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)]">
      {/* Decorative gradient glowing backgrounds */}
      <div className="absolute top-16 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        {/* HERO SECTION */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          id="hero-section"
        >
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs text-orange-400 mb-6 font-mono">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span>Next-Gen Earth Observation Road Pipeline</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Quantify Urban <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-blue-500">Resilience</span> From Space
          </h1>

          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            A state-of-the-art visual simulator mapping deep neural network occlusion recovery, curve-aware topological graph healing, and adversarial network stress testing for metropolitan planners.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage('pipeline')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-3.5 rounded-lg shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              id="cta-pipeline"
            >
              <span>Explore Pipeline Demo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold px-6 py-3.5 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              id="cta-dashboard"
            >
              <span>Interactive Dashboard</span>
            </button>
          </div>
        </motion.div>

        {/* 3-CARD SUMMARY: CHALLENGE, APPROACH, DIFFERENTIATOR */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          id="summary-cards"
        >
          {/* CHALLENGE */}
          <motion.div 
            variants={itemVariants}
            className="group relative rounded-xl border border-slate-900 bg-slate-950 p-8 hover:border-red-500/30 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-400 mb-6 border border-red-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">The Challenge</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Standard EO road extraction struggles with heavy tree canopy occlusions, urban shadow fractures, and high-density buildings. The resulting disconnected road masks break structural network analytics and misrepresent regional disaster readiness.
            </p>
          </motion.div>

          {/* APPROACH */}
          <motion.div 
            variants={itemVariants}
            className="group relative rounded-xl border border-slate-900 bg-slate-950 p-8 hover:border-blue-500/30 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 mb-6 border border-blue-500/20">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Our Approach</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We leverage an end-to-end framework starting with context-aware Attention U-Net pixel extraction, applying morphologic graph skeletonization, and deploying continuous spline curve-aware topological healing to form a perfectly continuous vector network.
            </p>
          </motion.div>

          {/* DIFFERENTIATORS */}
          <motion.div 
            variants={itemVariants}
            className="group relative rounded-xl border border-slate-900 bg-slate-950 p-8 hover:border-emerald-500/30 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Key Differentiator</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instead of simple straight-line connections, we compute curve tangent heading alignments to reconstruct roads that mimic actual civil engineering geometry. This realistic physics-informed modeling powers adversarial stress-testing simulation.
            </p>
          </motion.div>
        </motion.div>

        {/* 4 PILL BADGES SECTION */}
        <div className="border-t border-slate-900 pt-20" id="platform-capabilities">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Platform Capabilities</h2>
            <p className="text-sm text-slate-400 mt-2">Core modules powering the Route Resilience pipeline</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* BADGE 1: Occlusion Segmentation */}
            <div className="flex items-start space-x-4 rounded-xl bg-slate-900/40 border border-slate-900 p-6">
              <span className="flex-shrink-0 inline-flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 p-2.5 font-mono text-sm font-bold border border-blue-500/20">01</span>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 mb-2">
                  Occlusion-Robust Segmentation
                </span>
                <p className="text-sm text-slate-300 font-medium">Attention-guided CNN/Transformer models</p>
                <p className="text-xs text-slate-400 mt-1">
                  Integrates dual-attention modules to bridge canopy and shadows. Self-attention blocks dynamically weight contextual features along linear pathways, recovering fragmented structures.
                </p>
              </div>
            </div>

            {/* BADGE 2: Topology Healing */}
            <div className="flex items-start space-x-4 rounded-xl bg-slate-900/40 border border-slate-900 p-6">
              <span className="flex-shrink-0 inline-flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 p-2.5 font-mono text-sm font-bold border border-emerald-500/20">02</span>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
                  Topology Healing & Curve Reconstruction
                </span>
                <p className="text-sm text-slate-300 font-medium">Tangent alignment & Bezier interpolation</p>
                <p className="text-xs text-slate-400 mt-1">
                  Applies morphological thinning to extract road skeleton centrelines. Connects endpoints of broken roads by calculating the incoming angular vectors and fitting cubic Bezier curves.
                </p>
              </div>
            </div>

            {/* BADGE 3: Network Stress Testing */}
            <div className="flex items-start space-x-4 rounded-xl bg-slate-900/40 border border-slate-900 p-6">
              <span className="flex-shrink-0 inline-flex items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 p-2.5 font-mono text-sm font-bold border border-orange-500/20">03</span>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 mb-2">
                  Network Stress Testing
                </span>
                <p className="text-sm text-slate-300 font-medium">Adversarial node ablation simulation</p>
                <p className="text-xs text-slate-400 mt-1">
                  Quantifies systemic risk by mathematically identifying high-centrality intersections. Simulates progressive failures (flood zones, bottlenecks) to calculate the real-time structural Resilience Index.
                </p>
              </div>
            </div>

            {/* BADGE 4: Decision Dashboard */}
            <div className="flex items-start space-x-4 rounded-xl bg-slate-900/40 border border-slate-900 p-6">
              <span className="flex-shrink-0 inline-flex items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 p-2.5 font-mono text-sm font-bold border border-purple-500/20">04</span>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 mb-2">
                  Interactive Decision Dashboard
                </span>
                <p className="text-sm text-slate-300 font-medium">Real-time what-if scenario tool</p>
                <p className="text-xs text-slate-400 mt-1">
                  Provides a live geospatial workspace for planners. Click nodes to collapse routes instantly, visualize global traffic flow rerouting dynamically, and review smart mitigation alerts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CALL TO ACTION */}
        <div className="mt-20 text-center bg-slate-900/50 border border-slate-900 rounded-2xl p-10 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-2">Ready to test the urban resilience pipeline?</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-xl mx-auto">
            Experience our 4-phase Earth Observation demo. Run simulated preprocessing, test attention-heatmaps, toggle naively healed lines vs curves, and ablate nodes dynamically.
          </p>
          <button
            onClick={() => setCurrentPage('pipeline')}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold px-6 py-3 rounded-lg shadow transition-all cursor-pointer"
            id="start-demo-btn"
          >
            <span>Start Interactive Pipeline</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
