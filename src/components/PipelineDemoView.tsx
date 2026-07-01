import React, { useState, useEffect } from 'react';
import { Page, PhaseId, PreprocessingConfig, LossMetric } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, CheckCircle2, ChevronRight, Settings, Image as ImageIcon, Cpu, Eye, 
  Layers, GitFork, Compass, EyeOff, Activity, AlertTriangle, ShieldCheck, 
  Trash2, TrendingDown, ArrowRight, Info
} from 'lucide-react';

interface PipelineDemoViewProps {
  setCurrentPage: (page: Page) => void;
}

export default function PipelineDemoView({ setCurrentPage }: PipelineDemoViewProps) {
  const [activePhase, setActivePhase] = useState<PhaseId>(1);
  const [phaseProgress, setPhaseProgress] = useState<{ [key in PhaseId]: number }>({
    1: 0,
    2: 0,
    3: 0,
    4: 0
  });
  const [phaseCompleted, setPhaseCompleted] = useState<{ [key in PhaseId]: boolean }>({
    1: false,
    2: false,
    3: false,
    4: false
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // --- PHASE I STATES ---
  const [config, setConfig] = useState<PreprocessingConfig>({
    tiling: 4,
    contrast: 1.2,
    simulatedOcclusion: true,
  });
  const [useAttentionModel, setUseAttentionModel] = useState(true);
  const [useConnectivityLoss, setUseConnectivityLoss] = useState(true);
  const [metrics, setMetrics] = useState<LossMetric[]>([
    { name: 'Dice Coefficient', value: 45 },
    { name: 'IoU Score', value: 38 },
    { name: 'Boundary F1', value: 42 }
  ]);
  const [occlusionBeforeAfterToggle, setOcclusionBeforeAfterToggle] = useState<'before' | 'after'>('after');

  // --- PHASE II STATES ---
  const [thinningStep, setThinningStep] = useState<'mask' | 'thinning' | 'graph'>('graph');
  const [mstStep, setMstStep] = useState<'disconnected' | 'evaluating' | 'healed'>('healed');
  const [mstCandidateIndex, setMstCandidateIndex] = useState(0);
  const [curveAwareToggle, setCurveAwareToggle] = useState<boolean>(true);

  // --- PHASE III STATES ---
  const [ablationStep, setAblationStep] = useState<number>(0); // 0 = baseline, 1 = node 1 ablated, 2 = node 2, 3 = node 3
  const [isAblating, setIsAblating] = useState<boolean>(false);
  const [resilienceValue, setResilienceValue] = useState<number>(1.0);

  // MST evaluation intervals
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mstStep === 'evaluating') {
      interval = setInterval(() => {
        setMstCandidateIndex(prev => (prev + 1) % 4);
      }, 400);
    }
    return () => clearInterval(interval);
  }, [mstStep]);

  // Phase Execution simulation
  const runPhase = (phaseId: PhaseId) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setPhaseCompleted(prev => ({ ...prev, [phaseId]: false }));
    
    let progress = 0;
    const intervalTime = 20; // total 1.5 seconds roughly
    const step = 2;
    
    // Simulate metrics learning in Phase I
    if (phaseId === 1) {
      setMetrics([
        { name: 'Dice Coefficient', value: 42 },
        { name: 'IoU Score', value: 35 },
        { name: 'Boundary F1', value: 38 }
      ]);
    }

    const timer = setInterval(() => {
      progress += step;
      setPhaseProgress(prev => ({ ...prev, [phaseId]: Math.min(progress, 100) }));
      
      // Animate filling bars in Phase I
      if (phaseId === 1) {
        setMetrics(prev => prev.map(m => {
          const maxVal = m.name === 'Dice Coefficient' 
            ? (useAttentionModel ? (useConnectivityLoss ? 94 : 88) : 62)
            : m.name === 'IoU Score'
            ? (useAttentionModel ? (useConnectivityLoss ? 89 : 81) : 55)
            : (useAttentionModel ? (useConnectivityLoss ? 91 : 85) : 59);
          const currentVal = Math.round(40 + (maxVal - 40) * (progress / 100));
          return { ...m, value: currentVal };
        }));
      }

      if (progress >= 100) {
        clearInterval(timer);
        setIsProcessing(false);
        setPhaseCompleted(prev => ({ ...prev, [phaseId]: true }));
        
        // Auto-progress stepper
        if (phaseId < 4) {
          // Keep active phase but show completion
        }
      }
    }, intervalTime);
  };

  // Run Ablation Simulator
  const triggerAblationTest = () => {
    if (isAblating) return;
    setIsAblating(true);
    setAblationStep(0);
    setResilienceValue(1.0);

    // Step 1: Ablate Node 1 (Central Interchange) after 1s
    setTimeout(() => {
      setAblationStep(1);
      setResilienceValue(0.78);
      // Step 2: Ablate Node 2 (River Bridge) after 2s
      setTimeout(() => {
        setAblationStep(2);
        setResilienceValue(0.54);
        // Step 3: Ablate Node 3 (Highway Onramp) after 3s
        setTimeout(() => {
          setAblationStep(3);
          setResilienceValue(0.32);
          setIsAblating(false);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)] pb-16">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border-b border-slate-800 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">EO Pipeline Visual Simulator</h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Pristine simulation mode &bull; Real-time network synthesis parameters
              </p>
            </div>
            <div className="flex space-x-2 text-xs font-mono">
              <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-2.5 py-1 rounded">
                ENV: DEMO_SANDBOX
              </span>
              <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded">
                VERSION: 4.2.0-ALIGNED
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 mt-8 sm:px-6 lg:px-8">
        
        {/* STEPPER NAV */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8" id="pipeline-stepper">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            {[
              { id: 1, name: 'Phase I', label: 'Occlusion Segmentation', color: 'border-blue-500/30 text-blue-400' },
              { id: 2, name: 'Phase II', label: 'Topology & Curve Healing', color: 'border-emerald-500/30 text-emerald-400' },
              { id: 3, name: 'Phase III', label: 'Analysis & Stress Test', color: 'border-orange-500/30 text-orange-400' },
              { id: 4, name: 'Phase IV', label: 'Dashboard Integration', color: 'border-purple-500/30 text-purple-400' }
            ].map((p, idx) => (
              <React.Fragment key={p.id}>
                <button
                  onClick={() => setActivePhase(p.id as PhaseId)}
                  className={`flex flex-1 items-center space-x-3 p-3 rounded-lg text-left transition-all ${
                    activePhase === p.id 
                      ? 'bg-slate-800/80 border border-slate-700 shadow-md scale-[1.01]' 
                      : 'hover:bg-slate-800/40 border border-transparent'
                  }`}
                  id={`stepper-btn-${p.id}`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    phaseCompleted[p.id as PhaseId]
                      ? 'bg-emerald-500 text-slate-950'
                      : activePhase === p.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {phaseCompleted[p.id as PhaseId] ? <CheckCircle2 className="h-5 w-5 stroke-[2.5]" /> : p.id}
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase">{p.name}</span>
                    <span className="block text-xs font-semibold text-white leading-tight">{p.label}</span>
                  </div>
                </button>
                {idx < 3 && <ChevronRight className="hidden md:block h-4 w-4 text-slate-700" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ACTIVE PHASE VIEWER CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: Controls & Actions */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Run Pipeline Phase Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-300 font-mono tracking-wider uppercase mb-4">
                Pipeline Execution Control
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950 border border-slate-800 p-3.5 rounded-lg">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">SELECTED MODULE:</span>
                    <span className="block text-sm font-bold text-white mt-0.5">
                      {activePhase === 1 && 'Occlusion-Robust Segmentation'}
                      {activePhase === 2 && 'Graph Skeletonization & Healing'}
                      {activePhase === 3 && 'Network Stress Testing'}
                      {activePhase === 4 && 'Dashboard Hand-off'}
                    </span>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${phaseCompleted[activePhase] ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                </div>

                {/* Progress bar */}
                {phaseProgress[activePhase] > 0 && (
                  <div className="space-y-1.5" id="progress-container">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Synthesizing tensor frames...</span>
                      <span>{phaseProgress[activePhase]}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <motion.div 
                        className="bg-gradient-to-r from-orange-500 to-blue-500 h-full"
                        style={{ width: `${phaseProgress[activePhase]}%` }}
                        layout
                      />
                    </div>
                  </div>
                )}

                {/* Main trigger button */}
                <button
                  onClick={() => runPhase(activePhase)}
                  disabled={isProcessing}
                  className={`w-full inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-bold text-sm shadow transition-all ${
                    isProcessing
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-500 text-white cursor-pointer active:scale-[0.98]'
                  }`}
                  id="run-phase-btn"
                >
                  <Play className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{phaseCompleted[activePhase] ? 'Re-Run Module Synthesis' : 'Run Pipeline Phase'}</span>
                </button>
              </div>
            </div>

            {/* INTERACTIVE CONTROLS BY PHASE */}
            <AnimatePresence mode="wait">
              {/* PHASE I CONTROLS */}
              {activePhase === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6"
                  key="p1-ctrl"
                >
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
                      <Settings className="h-4 w-4 text-blue-400" />
                      1. Preprocessing Configuration
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Simulate high-resolution satellite preprocessing tweaks before model inference.
                    </p>

                    <div className="space-y-4">
                      {/* Tiling slider */}
                      <div>
                        <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                          <span>Tile Resolution (Grid)</span>
                          <span className="text-blue-400">{config.tiling} &times; {config.tiling}</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="8"
                          value={config.tiling}
                          onChange={(e) => setConfig({ ...config, tiling: parseInt(e.target.value) })}
                          className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      {/* Contrast slider */}
                      <div>
                        <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                          <span>Contrast Equalization</span>
                          <span className="text-blue-400">{config.contrast.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="2"
                          step="0.1"
                          value={config.contrast}
                          onChange={(e) => setConfig({ ...config, contrast: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      {/* Simulated Occlusion Toggle */}
                      <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-200">Overlay Canopy Occlusions</span>
                          <span className="text-[10px] text-slate-400 font-mono">Injected foliage blocks</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={config.simulatedOcclusion} 
                            onChange={(e) => setConfig({ ...config, simulatedOcclusion: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-blue-400" />
                      2. Deep Learning Models
                    </h3>
                    
                    <div className="space-y-3">
                      {/* Model Selector Toggle */}
                      <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                        <button
                          onClick={() => setUseAttentionModel(false)}
                          className={`py-1.5 rounded font-medium transition-all ${!useAttentionModel ? 'bg-slate-800 text-red-400 border border-red-500/20' : 'text-slate-400'}`}
                        >
                          Baseline (U-Net)
                        </button>
                        <button
                          onClick={() => setUseAttentionModel(true)}
                          className={`py-1.5 rounded font-medium transition-all ${useAttentionModel ? 'bg-slate-800 text-blue-400 border border-blue-500/20' : 'text-slate-400'}`}
                        >
                          Attention Transformer
                        </button>
                      </div>

                      {/* Loss function toggles */}
                      <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-200">Inject Connectivity Loss</span>
                          <span className="text-[10px] text-slate-400 font-mono">Enforces path coherence</span>
                        </div>
                        <label className="relative inline-flex inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={useConnectivityLoss} 
                            onChange={(e) => setUseConnectivityLoss(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE II CONTROLS */}
              {activePhase === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6"
                  key="p2-ctrl"
                >
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                      <GitFork className="h-4 w-4" />
                      1. Morphological Centerlines
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Step through the thinning algorithms to extract 1px centerlines from regional masks.
                    </p>

                    <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                      {[
                        { id: 'mask', label: '1. Mask Blob' },
                        { id: 'thinning', label: '2. Thinning' },
                        { id: 'graph', label: '3. Vector Node' }
                      ].map(step => (
                        <button
                          key={step.id}
                          onClick={() => setThinningStep(step.id as any)}
                          className={`py-1 rounded font-medium transition-all ${thinningStep === step.id ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
                        >
                          {step.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                      <Compass className="h-4 w-4" />
                      2. Topological Disjoint Sets
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Run Minimum Spanning Tree (MST) evaluations on disconnected components with angle diff thresholds.
                    </p>

                    <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                      {[
                        { id: 'disconnected', label: 'Isolated' },
                        { id: 'evaluating', label: 'Scanning' },
                        { id: 'healed', label: 'MST-Healed' }
                      ].map(s => (
                        <button
                          key={s.id}
                          onClick={() => setMstStep(s.id as any)}
                          className={`py-1 rounded font-medium transition-all ${mstStep === s.id ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-emerald-500" />
                      3. Curved Interpolation
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Compare standard naive linear bridges against angle-aware Bezier splines.
                    </p>

                    <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-200">Curve-Aware Healing</span>
                        <span className="text-[10px] text-slate-400 font-mono">Aligned bezier splines</span>
                      </div>
                      <label className="relative inline-flex inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={curveAwareToggle} 
                          onChange={(e) => setCurveAwareToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE III CONTROLS */}
              {activePhase === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6"
                  key="p3-ctrl"
                >
                  <div>
                    <h3 className="text-sm font-bold text-orange-400 mb-2 flex items-center gap-1.5">
                      <Activity className="h-4 w-4" />
                      1. Critical Node Ablation
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Simulate systemic risk by removing the highest-centrality intersections in a cascade and watching traffic routes adjust.
                    </p>

                    <div className="space-y-3">
                      <button
                        onClick={triggerAblationTest}
                        disabled={isAblating}
                        className={`w-full inline-flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                          isAblating
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-500 text-white cursor-pointer'
                        }`}
                        id="ablation-test-btn"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Run Cascading Stress Test</span>
                      </button>

                      <button
                        onClick={() => {
                          setAblationStep(0);
                          setResilienceValue(1.0);
                        }}
                        className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 py-2 rounded-lg text-xs font-semibold"
                        id="reset-ablation-btn"
                      >
                        Reset Network State
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <h3 className="text-sm font-bold text-white mb-2">Vulnerability Logs</h3>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Ablation Node 1 (Central Pt)</span>
                        <span className={ablationStep >= 1 ? 'text-red-400' : 'text-slate-500'}>
                          {ablationStep >= 1 ? 'REMOVED' : 'ACTIVE'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ablation Node 2 (River Brg)</span>
                        <span className={ablationStep >= 2 ? 'text-red-400' : 'text-slate-500'}>
                          {ablationStep >= 2 ? 'REMOVED' : 'ACTIVE'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ablation Node 3 (Highway Rmp)</span>
                        <span className={ablationStep >= 3 ? 'text-red-400' : 'text-slate-500'}>
                          {ablationStep >= 3 ? 'REMOVED' : 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE IV CONTROLS */}
              {activePhase === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
                  key="p4-ctrl"
                >
                  <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-1">
                      Platform Integration Ready
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      All processed Earth Observation layers and reconstructed road networks are ready for geospatial deployment in the Interactive Planning Workspace.
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Occlusion-robust shapefile exported</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Curved Bezier vector topology healed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Stress tests compiled (R = 0.44 - 1.00)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg text-sm shadow cursor-pointer active:scale-[0.98] transition-all"
                    id="p4-dashboard-btn"
                  >
                    <span>Open Planning Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT SIDEBAR: Primary Visualization Canvas */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 h-[560px] flex flex-col relative overflow-hidden" id="viz-canvas">
            
            {/* Visual Canvas Top Stats Bar */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-mono text-slate-400">
                OUTPUT SCREEN &bull; {activePhase === 1 && 'SATELLITE IMAGE SECTOR'}
                {activePhase === 2 && 'ALGORITHM VECTOR PREVIEW'}
                {activePhase === 3 && 'ADVERSARIAL ATTACK TESTBOARD'}
                {activePhase === 4 && 'DASHBOARD HAND-OFF INTEGRATION'}
              </span>
              <div className="flex space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
            </div>

            {/* MAIN CANVAS ELEMENT - DYNAMIC ACCORDING TO ACTIVE PHASE */}
            <div className="flex-1 bg-slate-950 rounded-lg relative overflow-hidden border border-slate-800/60 flex items-center justify-center">
              
              <AnimatePresence mode="wait">
                {/* PHASE I CANVAS */}
                {activePhase === 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full relative flex flex-col"
                    key="p1-canvas"
                  >
                    {/* Render raw satellite photo background with Grid */}
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-[0.04]">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} className="border border-white" />
                      ))}
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto">
                      
                      {/* LEFT: SATELLITE INPUT IMAGE */}
                      <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 flex flex-col h-full justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                              1. Satellite Input (Band 4-3-2)
                            </span>
                            <span className="bg-blue-500/10 text-blue-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20">
                              RAW IMAGERY
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                            High-resolution Earth Observation sensor feed with dense forest canopy occlusions blocking road surfaces.
                          </p>
                        </div>
                        
                        <div className="flex-1 min-h-[180px] bg-slate-900/40 rounded border border-slate-800/60 relative flex items-center justify-center overflow-hidden">
                          {/* Crosshair grids for raw satellite feel */}
                          <div className="absolute inset-0 pointer-events-none border border-slate-800/30 grid grid-cols-4 grid-rows-4 opacity-40"></div>
                          
                          <svg className="w-full h-full max-h-[180px] p-2" style={{ filter: `contrast(${config.contrast})` }}>
                            <defs>
                              <linearGradient id="satRoadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#475569" />
                                <stop offset="100%" stopColor="#334155" />
                              </linearGradient>
                            </defs>
                            
                            {/* Base Roads in Satellite Image */}
                            <path d="M 30,30 Q 150,40 180,140" fill="none" stroke="url(#satRoadGrad)" strokeWidth="12" strokeLinecap="round" />
                            <path d="M 180,140 T 260,200" fill="none" stroke="url(#satRoadGrad)" strokeWidth="12" strokeLinecap="round" />
                            <path d="M 20,180 Q 100,145 180,140" fill="none" stroke="url(#satRoadGrad)" strokeWidth="12" strokeLinecap="round" />

                            {/* Simulated Occlusions (Tree Canopy Blobs) */}
                            {config.simulatedOcclusion && (
                              <g className="transition-opacity duration-300">
                                <circle cx="150" cy="80" r="30" fill="#15803d" fillOpacity="0.75" />
                                <circle cx="170" cy="95" r="24" fill="#166534" fillOpacity="0.75" />
                                <circle cx="130" cy="72" r="20" fill="#15803d" fillOpacity="0.75" />
                                <circle cx="90" cy="155" r="26" fill="#166534" fillOpacity="0.75" />
                              </g>
                            )}
                          </svg>

                          {/* Top-right coordinates stamp */}
                          <div className="absolute top-1.5 right-1.5 bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 text-[8px] font-mono text-slate-500">
                            EO-B12 &bull; Active
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: TRANSFORMER GENERATED IMAGE / MODEL PREDICTION */}
                      <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 flex flex-col h-full justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                              2. Transformer Generated Image
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${useAttentionModel ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              {useAttentionModel ? 'ATTN MASK' : 'UNET MASK'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                            {useAttentionModel 
                              ? 'Attention-based feature extraction with dynamic, healed connectivity predictions over occluded regions.' 
                              : 'Standard convolutional segmentation output struggling to preserve connectivity underneath canopy cover.'}
                          </p>
                        </div>
                        
                        <div className="flex-1 min-h-[180px] bg-[#090d16] rounded border border-slate-800/60 relative flex items-center justify-center overflow-hidden">
                          {/* Neural network style pixel grid backdrop */}
                          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px]"></div>

                          <svg className="w-full h-full max-h-[180px] p-2">
                            <defs>
                              <filter id="satGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                            </defs>

                            {/* Predicted Segmentation Mask Output */}
                            {!useAttentionModel && (
                              <g className="transition-opacity duration-300">
                                {/* Left Segment */}
                                <path d="M 30,30 Q 110,35 125,50" fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
                                {/* Gap Failure Red dashes */}
                                <path d="M 125,50 Q 150,65 170,90" fill="none" stroke="#ef4444" strokeWidth="6" strokeDasharray="4,4" strokeLinecap="round" />
                                {/* Gap bad notification badge */}
                                <g transform="translate(115, 30)">
                                  <rect width="60" height="13" rx="2" fill="#ef4444" fillOpacity="0.9" />
                                  <text x="4" y="9" fill="white" fontSize="6.5" fontFamily="monospace" fontWeight="bold">GAP AT 150,80</text>
                                </g>
                                {/* Right Segment */}
                                <path d="M 170,90 Q 180,140 260,200" fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />

                                {/* Second route gap */}
                                <path d="M 20,180 Q 60,155 75,150" fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
                                <path d="M 75,150 Q 105,142 180,140" fill="none" stroke="#ef4444" strokeWidth="6" strokeDasharray="4,4" strokeLinecap="round" />
                                <g transform="translate(65, 165)">
                                  <rect width="60" height="13" rx="2" fill="#ef4444" fillOpacity="0.9" />
                                  <text x="4" y="9" fill="white" fontSize="6.5" fontFamily="monospace" fontWeight="bold">GAP AT 90,155</text>
                                </g>
                              </g>
                            )}

                            {useAttentionModel && (
                              <g className="transition-opacity duration-300">
                                {/* Completely recovered mask line */}
                                <path d="M 30,30 Q 150,40 180,140" fill="none" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round" />
                                <path d="M 180,140 T 260,200" fill="none" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round" />
                                
                                <path 
                                  d="M 20,180 Q 100,145 180,140" 
                                  fill="none" 
                                  stroke="#60a5fa" 
                                  strokeWidth={useConnectivityLoss ? 6 : 4} 
                                  strokeDasharray={useConnectivityLoss ? "0" : "5,5"} 
                                  strokeLinecap="round"
                                />

                                {/* Self-Attention Heatmap Glow overlay */}
                                {config.simulatedOcclusion && (
                                  <g>
                                    <circle cx="150" cy="80" r="15" fill="#f97316" fillOpacity="0.6" filter="url(#satGlow)" />
                                    <circle cx="90" cy="155" r="14" fill="#3b82f6" fillOpacity="0.5" filter="url(#satGlow)" />
                                  </g>
                                )}
                              </g>
                            )}
                          </svg>

                          {/* Top-right statistics stamp */}
                          <div className="absolute top-1.5 right-1.5 bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 text-[8px] font-mono text-emerald-400">
                            IOU: {useAttentionModel ? (useConnectivityLoss ? '0.89' : '0.81') : '0.55'}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* METRIC LOSS PANEL AT BOTTOM */}
                    <div className="bg-slate-900 border-t border-slate-800 p-4">
                      <div className="grid grid-cols-3 gap-4">
                        {metrics.map((m, i) => (
                          <div key={i} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg">
                            <span className="block text-[10px] font-mono text-slate-400 uppercase">{m.name}</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-base font-bold ${m.value > 80 ? 'text-blue-400' : 'text-slate-300'}`}>
                                {(m.value / 100).toFixed(2)}
                              </span>
                              <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${useAttentionModel ? 'bg-blue-500' : 'bg-red-500'}`} 
                                  style={{ width: `${m.value}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PHASE II CANVAS - THE CORE CRITICAL RECONSTRUCTION SUB-PANEL */}
                {activePhase === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex flex-col relative"
                    key="p2-canvas"
                  >
                    {/* Main Split Visualization Area */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 min-h-[300px]">
                      
                      {/* LEFT SUB-PANEL: Naive straight-line bridging */}
                      <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                            Naive Straight-Line Bridging
                          </span>
                          <span className="bg-red-500/10 text-red-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/20">
                            BASELINE GAP
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                          Ignores road tangent headings. Connects coordinates directly, creating jagged, unphysical lines that breach urban terrain boundaries.
                        </p>

                        {/* Naive SVG Drawing */}
                        <div className="flex-1 bg-slate-900/60 rounded border border-slate-800/40 relative flex items-center justify-center overflow-hidden">
                          <svg className="w-full h-full max-h-[220px]">
                            {/* Two curved road segments */}
                            {/* Segment A (Left, incoming curve) */}
                            <path d="M 20,40 C 60,60 100,110 110,130" fill="none" stroke="#475569" strokeWidth="8" />
                            <circle cx="110" cy="130" r="4" fill="#f87171" />
                            <text x="115" y="128" fill="#f87171" fontSize="9" fontFamily="monospace">Endpoint A</text>

                            {/* Segment B (Right, outgoing curve) */}
                            <path d="M 170,160 C 190,140 220,90 260,80" fill="none" stroke="#475569" strokeWidth="8" />
                            <circle cx="170" cy="160" r="4" fill="#f87171" />
                            <text x="175" y="172" fill="#f87171" fontSize="9" fontFamily="monospace">Endpoint B</text>

                            {/* Naive Straight Line connection */}
                            <line x1="110" y1="130" x2="170" y2="160" stroke="#ef4444" strokeWidth="4" strokeDasharray="4,4" className="animate-pulse" />
                            <g transform="translate(112, 150)">
                              <rect width="68" height="15" rx="3" fill="#ef4444" fillOpacity="0.85" />
                              <text x="5" y="11" fill="white" fontSize="8" fontFamily="monospace" fontWeight="bold">JAGGED LINK</text>
                            </g>

                            {/* Tangent mismatch lines to highlight bad angular alignment */}
                            <line x1="110" y1="130" x2="130" y2="170" stroke="#f87171" strokeWidth="1.5" strokeDasharray="2,2" />
                            <line x1="170" y1="160" x2="135" y2="195" stroke="#f87171" strokeWidth="1.5" strokeDasharray="2,2" />
                          </svg>
                        </div>
                      </div>

                      {/* RIGHT SUB-PANEL: Angle-aware curved reconstruction */}
                      <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                            Angle-Aware Curved Healing
                          </span>
                          <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20">
                            CUBIC BEZIER SPLINE
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                          Samples incoming tangent vectors at both endpoints. Fits a continuous cubic Bezier arc respecting angular constraints for professional civil layout.
                        </p>

                        {/* Curve-Aware SVG Drawing */}
                        <div className="flex-1 bg-slate-900/60 rounded border border-slate-800/40 relative flex items-center justify-center overflow-hidden">
                          <svg className="w-full h-full max-h-[220px]">
                            {/* Two curved road segments */}
                            {/* Segment A */}
                            <path d="M 20,40 C 60,60 100,110 110,130" fill="none" stroke="#475569" strokeWidth="8" />
                            <circle cx="110" cy="130" r="4" fill="#34d399" />
                            <text x="112" y="123" fill="#34d399" fontSize="9" fontFamily="monospace">A</text>

                            {/* Segment B */}
                            <path d="M 170,160 C 190,140 220,90 260,80" fill="none" stroke="#475569" strokeWidth="8" />
                            <circle cx="170" cy="160" r="4" fill="#34d399" />
                            <text x="172" y="172" fill="#34d399" fontSize="9" fontFamily="monospace">B</text>

                            {/* Protractor Angular Indicators (faint green circles with arc markers) */}
                            <circle cx="110" cy="130" r="14" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" strokeOpacity="0.7" />
                            <path d="M 110,116 A 14 14 0 0 1 120,139" fill="none" stroke="#34d399" strokeWidth="1.5" />
                            <text x="94" y="145" fill="#34d399" fontSize="7" fontFamily="monospace">&theta;1: -32&deg;</text>

                            <circle cx="170" cy="160" r="14" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" strokeOpacity="0.7" />
                            <path d="M 156,160 A 14 14 0 0 1 174,147" fill="none" stroke="#34d399" strokeWidth="1.5" />
                            <text x="175" y="152" fill="#34d399" fontSize="7" fontFamily="monospace">&theta;2: +45&deg;</text>

                            {/* Control points representing tangents (faint glowing yellow dots) */}
                            <line x1="110" y1="130" x2="130" y2="150" stroke="#f59e0b" strokeWidth="1" strokeDasharray="1,1" />
                            <circle cx="130" cy="150" r="3" fill="#f59e0b" />
                            
                            <line x1="170" y1="160" x2="150" y2="140" stroke="#f59e0b" strokeWidth="1" strokeDasharray="1,1" />
                            <circle cx="150" cy="140" r="3" fill="#f59e0b" />

                            {/* Smooth Bezier Spline connecting A to B */}
                            <motion.path 
                              d="M 110,130 C 130,150 150,140 170,160" 
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="4.5"
                              initial={{ strokeDasharray: 200, strokeDashoffset: 200 }}
                              animate={{ strokeDashoffset: 0 }}
                              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            />
                            
                            <g transform="translate(122, 110)">
                              <rect width="68" height="15" rx="3" fill="#10b981" fillOpacity="0.85" />
                              <text x="5" y="11" fill="slate-950" fontSize="8" fontFamily="monospace" fontWeight="bold">BEZIER ALIGNED</text>
                            </g>
                          </svg>
                        </div>
                      </div>

                    </div>

                    {/* LIVE INTERACTIVE TOGGLE BANNER FOR COMPARISON */}
                    <div className="bg-slate-900 border-t border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-slate-300">
                          Toggle the switch in the control column to flip curve healing states live.
                        </span>
                      </div>
                      <div className="flex space-x-4 text-xs font-mono">
                        <div className="flex items-center space-x-1.5">
                          <span className="h-3 w-3 rounded-full bg-emerald-500" />
                          <span>Curvature Continuity: C2 Aligned</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="h-3 w-3 rounded-full bg-blue-500" />
                          <span>RMSE Error: 0.042m</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PHASE III CANVAS */}
                {activePhase === 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex flex-col relative"
                    key="p3-canvas"
                  >
                    <div className="flex-1 relative p-6 flex flex-col justify-between">
                      {/* Interactive Graph Plotting Area */}
                      <div className="flex-1 bg-slate-950/60 rounded-xl border border-slate-800/40 relative overflow-hidden flex items-center justify-center">
                        <svg className="w-full h-full max-h-[340px]">
                          <defs>
                            {/* Fracture filter for deleted nodes */}
                            <filter id="fracture">
                              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
                              <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
                            </filter>
                          </defs>

                          {/* Network paths (Edges) */}
                          {/* Top-to-Bottom high centrality routes */}
                          <line 
                            x1="60" y1="60" x2="160" y2="120" 
                            stroke={ablationStep >= 1 ? '#ef4444' : '#60a5fa'} 
                            strokeWidth={ablationStep >= 1 ? '1.5' : '4'} 
                            strokeDasharray={ablationStep >= 1 ? '3,3' : '0'} 
                          />
                          <line 
                            x1="160" y1="120" x2="130" y2="240" 
                            stroke={ablationStep >= 2 ? '#ef4444' : '#60a5fa'} 
                            strokeWidth={ablationStep >= 2 ? '1.5' : '4'} 
                            strokeDasharray={ablationStep >= 2 ? '3,3' : '0'} 
                          />
                          <line 
                            x1="130" y1="240" x2="240" y2="280" 
                            stroke={ablationStep >= 3 ? '#ef4444' : '#60a5fa'} 
                            strokeWidth={ablationStep >= 3 ? '1.5' : '4'} 
                            strokeDasharray={ablationStep >= 3 ? '3,3' : '0'} 
                          />

                          {/* Alternate Rerouted paths (Orange detours) when nodes are ablated */}
                          {ablationStep >= 1 && (
                            <motion.path 
                              d="M 60,60 Q 110,30 200,100" 
                              fill="none" 
                              stroke="#f97316" 
                              strokeWidth="3.5" 
                              strokeDasharray="4,4"
                              initial={{ strokeDashoffset: 100 }}
                              animate={{ strokeDashoffset: 0 }}
                              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                            />
                          )}
                          {ablationStep >= 2 && (
                            <motion.path 
                              d="M 200,100 Q 280,180 240,280" 
                              fill="none" 
                              stroke="#f97316" 
                              strokeWidth="3.5" 
                              strokeDasharray="4,4"
                              initial={{ strokeDashoffset: 100 }}
                              animate={{ strokeDashoffset: 0 }}
                              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                            />
                          )}

                          {/* Secondary edges */}
                          <line x1="60" y1="60" x2="40" y2="180" stroke="#475569" strokeWidth="2.5" />
                          <line x1="40" y1="180" x2="130" y2="240" stroke="#475569" strokeWidth="2.5" />
                          <line x1="200" y1="100" x2="160" y2="120" stroke="#475569" strokeWidth="2.5" />

                          {/* Plotting graph nodes */}
                          {/* Node 1: Central Point (Ablated at step 1) */}
                          <g transform="translate(160, 120)" className="cursor-pointer">
                            <motion.circle 
                              r={ablationStep >= 1 ? 14 : 22} 
                              fill={ablationStep >= 1 ? '#334155' : '#ef4444'} 
                              stroke={ablationStep >= 1 ? '#475569' : '#ffffff'} 
                              strokeWidth="2.5"
                              filter={ablationStep >= 1 ? 'url(#fracture)' : ''}
                            />
                            {ablationStep < 1 && (
                              <circle r="30" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-ping opacity-60" />
                            )}
                            <text dy="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                              {ablationStep >= 1 ? 'X' : 'N1'}
                            </text>
                            <text y="-26" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                              {ablationStep >= 1 ? 'Ablated' : 'BC: 0.94'}
                            </text>
                          </g>

                          {/* Node 2: River Bridge (Ablated at step 2) */}
                          <g transform="translate(130, 240)" className="cursor-pointer">
                            <motion.circle 
                              r={ablationStep >= 2 ? 12 : 18} 
                              fill={ablationStep >= 2 ? '#334155' : '#f97316'} 
                              stroke={ablationStep >= 2 ? '#475569' : '#ffffff'} 
                              strokeWidth="2"
                              filter={ablationStep >= 2 ? 'url(#fracture)' : ''}
                            />
                            {ablationStep === 1 && (
                              <circle r="24" fill="none" stroke="#f97316" strokeWidth="1" className="animate-ping opacity-60" />
                            )}
                            <text dy="3.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                              {ablationStep >= 2 ? 'X' : 'N2'}
                            </text>
                            <text y="28" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                              {ablationStep >= 2 ? 'Severed' : 'BC: 0.78'}
                            </text>
                          </g>

                          {/* Node 3: Highway Ramp (Ablated at step 3) */}
                          <g transform="translate(240, 280)" className="cursor-pointer">
                            <motion.circle 
                              r={ablationStep >= 3 ? 10 : 16} 
                              fill={ablationStep >= 3 ? '#334155' : '#eab308'} 
                              stroke={ablationStep >= 3 ? '#475569' : '#ffffff'} 
                              strokeWidth="2"
                              filter={ablationStep >= 3 ? 'url(#fracture)' : ''}
                            />
                            {ablationStep === 2 && (
                              <circle r="22" fill="none" stroke="#eab308" strokeWidth="1" className="animate-ping opacity-60" />
                            )}
                            <text dy="3.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                              {ablationStep >= 3 ? 'X' : 'N3'}
                            </text>
                            <text y="24" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                              {ablationStep >= 3 ? 'Down' : 'BC: 0.63'}
                            </text>
                          </g>

                          {/* Normal Nodes */}
                          <g transform="translate(60, 60)">
                            <circle r="12" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                            <text dy="3" textAnchor="middle" fill="white" fontSize="8">N4</text>
                          </g>
                          <g transform="translate(200, 100)">
                            <circle r="12" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                            <text dy="3" textAnchor="middle" fill="white" fontSize="8">N5</text>
                          </g>
                          <g transform="translate(40, 180)">
                            <circle r="10" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                            <text dy="3" textAnchor="middle" fill="white" fontSize="8">N6</text>
                          </g>
                        </svg>

                        {/* Flooding Overlay indicator when node is deleted */}
                        {ablationStep >= 2 && (
                          <div className="absolute inset-x-0 bottom-0 bg-blue-500/10 border-t border-blue-500/30 p-2 text-center text-[10px] font-mono text-blue-400 animate-pulse">
                            &bull; SIMULATED FLOOD INUNDATION CRITICAL SECTOR DETECTED &bull;
                          </div>
                        )}
                      </div>

                      {/* STATS COUNTUP HUD GAUGE */}
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Ablated Nodes</span>
                          <span className="text-xl font-bold text-red-400 mt-1">{ablationStep} <span className="text-xs text-slate-500">/ 3</span></span>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Reroutes Engaged</span>
                          <span className="text-xl font-bold text-orange-400 mt-1">
                            {ablationStep === 0 ? '0' : ablationStep === 1 ? '1' : '2'} <span className="text-xs text-slate-500">sectors</span>
                          </span>
                        </div>

                        {/* Resilience Counter Gauge */}
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Resilience (R)</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xl font-extrabold ${
                              resilienceValue > 0.7 ? 'text-emerald-400' : resilienceValue > 0.4 ? 'text-yellow-400' : 'text-red-500'
                            }`}>
                              {resilienceValue.toFixed(2)}
                            </span>
                            <div className="w-12 h-2.5 rounded-full bg-slate-950 overflow-hidden relative border border-slate-800">
                              <div 
                                className={`h-full ${
                                  resilienceValue > 0.7 ? 'bg-emerald-400' : resilienceValue > 0.4 ? 'bg-yellow-400' : 'bg-red-500'
                                }`}
                                style={{ width: `${resilienceValue * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PHASE IV CANVAS */}
                {activePhase === 4 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full p-6 flex flex-col justify-between"
                    key="p4-canvas"
                  >
                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                      <div className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-6 animate-pulse">
                        <ShieldCheck className="h-10 w-10" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2">Simulation Pipeline Complete</h3>
                      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                        The AI urban road extraction algorithm has successfully generated continuous networks, fitted curvature splines, and registered high-importance stress indices. Let's hand off this dynamic model to the interactive planning map.
                      </p>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl w-full text-left font-mono text-[11px] text-slate-300 space-y-1.5">
                        <div className="flex justify-between">
                          <span>&bull; Bengaluru Central Grid exported</span>
                          <span className="text-purple-400">SUCCESS</span>
                        </div>
                        <div className="flex justify-between">
                          <span>&bull; Bezier tangent models baked</span>
                          <span className="text-purple-400">100% ALIGNED</span>
                        </div>
                        <div className="flex justify-between">
                          <span>&bull; Adversarial ablation vectors built</span>
                          <span className="text-purple-400">READY</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-slate-800 pt-4 mt-4">
                      <button
                        onClick={() => setCurrentPage('dashboard')}
                        className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer active:scale-[0.98]"
                      >
                        <span>Open Full Planning Workspace</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
