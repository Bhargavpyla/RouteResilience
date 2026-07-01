import React, { useState, useEffect } from 'react';
import { Page, GraphNode, GraphEdge, ScenarioType, AlertItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Map as MapIcon, Sliders, AlertTriangle, Play, HelpCircle, Layers, 
  MapPin, Radio, Compass, RefreshCw, Star, Info, Zap, ChevronRight, X
} from 'lucide-react';

export default function DashboardView() {
  // Scenario Dropdown
  const [scenario, setScenario] = useState<ScenarioType>('manual');
  
  // Map Layer Toggles
  const [layers, setLayers] = useState({
    satellite: false,
    heatmap: true,
    grid: true,
    curves: true,
  });

  // Bengaluru Grid Nodes
  const [nodes, setNodes] = useState<GraphNode[]>([
    { id: 'N1', name: 'MG Road Interchange', x: 250, y: 150, lat: "12°58'28\" N", lng: "77°36'31\" E", centrality: 0.94, active: true, isCritical: true, district: 'Central CBD' },
    { id: 'N2', name: 'Outer Ring Road Bridge', x: 400, y: 110, lat: "12°59'04\" N", lng: "77°38'15\" E", centrality: 0.81, active: true, isCritical: true, district: 'ORR Sector 4' },
    { id: 'N3', name: 'Electronic City Tollway', x: 380, y: 280, lat: "12°51'12\" N", lng: "77°39'44\" E", centrality: 0.65, active: true, isCritical: false, district: 'Tech Hub South' },
    { id: 'N4', name: 'Yeshwanthpur Junction', x: 110, y: 90, lat: "13°01'44\" N", lng: "77°32'21\" E", centrality: 0.72, active: true, isCritical: true, district: 'Peenya Ind.' },
    { id: 'N5', name: 'Whitefield Overpass', x: 450, y: 200, lat: "12°58'02\" N", lng: "77°45'00\" E", centrality: 0.58, active: true, isCritical: false, district: 'East IT Corridor' },
    { id: 'N6', name: 'Koramangala Boulevard', x: 220, y: 250, lat: "12°56'01\" N", lng: "77°37'19\" E", centrality: 0.48, active: true, isCritical: false, district: 'Residential Inner' },
    { id: 'N7', name: 'Hebbal Flyover Link', x: 180, y: 40, lat: "13°02'12\" N", lng: "77°35'45\" E", centrality: 0.83, active: true, isCritical: true, district: 'North Gateway' },
  ]);

  // Edges mapping Bengaluru Road Segments (Bezier Curves)
  const [edges, setEdges] = useState<GraphEdge[]>([
    { id: 'E1', from: 'N7', to: 'N1', active: true, isCurved: true, controlX: 200, controlY: 90, criticality: 'high' },
    { id: 'E2', from: 'N1', to: 'N2', active: true, isCurved: true, controlX: 320, controlY: 100, criticality: 'high' },
    { id: 'E3', from: 'N2', to: 'N5', active: true, isCurved: true, controlX: 440, controlY: 140, criticality: 'medium' },
    { id: 'E4', from: 'N5', to: 'N3', active: true, isCurved: true, controlX: 430, controlY: 250, criticality: 'medium' },
    { id: 'E5', from: 'N3', to: 'N6', active: true, isCurved: true, controlX: 300, controlY: 280, criticality: 'medium' },
    { id: 'E6', from: 'N6', to: 'N1', active: true, isCurved: true, controlX: 230, controlY: 200, criticality: 'low' },
    { id: 'E7', from: 'N4', to: 'N1', active: true, isCurved: true, controlX: 180, controlY: 130, criticality: 'high' },
    { id: 'E8', from: 'N4', to: 'N7', active: true, isCurved: true, controlX: 130, controlY: 50, criticality: 'low' },
    { id: 'E9', from: 'N6', to: 'N4', active: true, isCurved: true, controlX: 140, controlY: 180, criticality: 'low' },
  ]);

  // Clicked node for detailed sectoral popup
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // Custom HUD Alert list
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: '1', type: 'warning', message: 'MG Road Interchange is carrying 1.4x critical threshold traffic.', time: '05:12' },
    { id: '2', type: 'info', message: 'Cubic Bezier curve-awareness calibrated on Hebbal segment (RMSE: 0.03).', time: '04:55' },
    { id: '3', type: 'success', message: 'Resilience index stabilized above 0.80 following ORR healing cycle.', time: '04:30' },
  ]);

  // Coordinates hover tracking on Map Console
  const [mouseCoords, setMouseCoords] = useState({ x: 230, y: 120, lat: "12°57'55\"", lng: "77°36'04\"" });

  // Dynamically swap node statuses when scenario changes
  useEffect(() => {
    if (scenario === 'flood') {
      // Flood disables Electronic City (N3) and Koramangala Boulevard (N6)
      setNodes(prev => prev.map(n => {
        if (n.id === 'N3' || n.id === 'N6') {
          return { ...n, active: false };
        }
        return { ...n, active: true };
      }));
      setAlerts([
        { id: 'f1', type: 'warning', message: 'CRITICAL FLOODING: Sector South (Electronic City) & Koramangala fully inundated.', time: '05:22' },
        { id: 'f2', type: 'info', message: 'Detour engaged: Redirecting Southbound freight via ORR Bypass Lanes.', time: '05:20' },
        { id: 'f3', type: 'warning', message: 'Global Resilience Index dropped to 0.54.', time: '05:19' }
      ]);
    } else if (scenario === 'multi-failure') {
      // Multi-node failure disables MG Road (N1) and Outer Ring Road (N2)
      setNodes(prev => prev.map(n => {
        if (n.id === 'N1' || n.id === 'N2') {
          return { ...n, active: false };
        }
        return { ...n, active: true };
      }));
      setAlerts([
        { id: 'm1', type: 'warning', message: 'MASSIVE GRIDLOCK: MG Road Bridge reconstruction coupled with ORR main collapse.', time: '05:23' },
        { id: 'm2', type: 'warning', message: 'Hebbal Flyover (N7) is taking 240% baseline traffic load.', time: '05:21' },
        { id: 'm3', type: 'info', message: 'Urgent alternate route recommended: Outer bypass via Whitefield (N5) Corridor.', time: '05:18' }
      ]);
    } else {
      // Reset to manual configuration (All active by default)
      setNodes(prev => prev.map(n => ({ ...n, active: true })));
      setAlerts([
        { id: '1', type: 'warning', message: 'MG Road Interchange is carrying 1.4x critical threshold traffic.', time: '05:12' },
        { id: '2', type: 'info', message: 'Cubic Bezier curve-awareness calibrated on Hebbal segment (RMSE: 0.03).', time: '04:55' },
        { id: '3', type: 'success', message: 'Resilience index stabilized above 0.80 following ORR healing cycle.', time: '04:30' },
      ]);
    }
    setSelectedNode(null);
  }, [scenario]);

  // Synchronize edge active states with connecting nodes
  const updatedEdges = edges.map(edge => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    const active = !!(fromNode?.active && toNode?.active);
    return { ...edge, active };
  });

  // Calculate dynamic Resilience Index based on active nodes
  const activeNodesCount = nodes.filter(n => n.active).length;
  const totalNodes = nodes.length;
  // Baseline R = 1.0. Deduct penalty for ablated critical nodes
  let resilienceIndex = 1.0;
  nodes.forEach(n => {
    if (!n.active) {
      resilienceIndex -= n.isCritical ? 0.22 : 0.09;
    }
  });
  resilienceIndex = Math.max(0.32, Math.min(1.0, resilienceIndex));

  // Toggle individual nodes manually
  const toggleNode = (nodeId: string) => {
    if (scenario !== 'manual') {
      // Swapping back to manual to allow custom clicking
      setScenario('manual');
    }
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextState = !n.active;
        const updatedNode = { ...n, active: nextState };
        if (!nextState) {
          // If ablated, trigger detail popup instantly
          setSelectedNode(updatedNode);
          // Add logs
          setAlerts(prevA => [
            { id: Date.now().toString(), type: 'warning', message: `Manual ablation triggered: Node ${n.id} (${n.name}) disabled.`, time: '05:23' },
            ...prevA
          ]);
        } else {
          if (selectedNode?.id === nodeId) setSelectedNode(null);
          setAlerts(prevA => [
            { id: Date.now().toString(), type: 'success', message: `Node ${n.id} (${n.name}) restored and reintegrated.`, time: '05:23' },
            ...prevA
          ]);
        }
        return updatedNode;
      }
      return n;
    }));
  };

  // Prepare chart data for Recharts (Centrality by District)
  const chartData = nodes.map(n => ({
    name: n.id,
    district: n.district,
    centrality: n.centrality,
    active: n.active,
    isCritical: n.isCritical,
  }));

  // Track map canvas movement to simulate real GIS cursor tracking
  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    
    // Convert to mock coordinates
    const latDecimal = 12.9 + (y / 350) * 0.2;
    const lngDecimal = 77.5 + (x / 500) * 0.3;
    
    setMouseCoords({
      x,
      y,
      lat: `${Math.floor(latDecimal)}°${Math.floor((latDecimal % 1) * 60)}'${Math.floor(((latDecimal % 1) * 3600) % 60)}" N`,
      lng: `${Math.floor(lngDecimal)}°${Math.floor((lngDecimal % 1) * 60)}'${Math.floor(((lngDecimal % 1) * 3600) % 60)}" E`
    });
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)] pb-12">
      {/* TOP KPI HUD BAR */}
      <div className="bg-slate-900 border-b border-slate-800 py-5 sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center space-x-3.5">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 leading-none mb-1">Total Road Recovered</span>
                <span className="text-xl font-bold text-white font-sans">284.2 <span className="text-xs font-medium text-slate-500">km</span></span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center space-x-3.5">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 leading-none mb-1">Topological Gaps Healed</span>
                <span className="text-xl font-bold text-white font-sans">42 <span className="text-xs font-medium text-slate-500">sectors</span></span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center space-x-3.5">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 leading-none mb-1">Bezier Curves Fitted</span>
                <span className="text-xl font-bold text-white font-sans">18 <span className="text-xs font-medium text-slate-500">splines</span></span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center space-x-3.5">
              <div className={`h-10 w-10 flex items-center justify-center rounded-lg border text-base font-bold ${
                resilienceIndex > 0.7 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {Math.round(resilienceIndex * 100)}
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 leading-none mb-1">Resilience Index (R)</span>
                <span className={`text-xl font-extrabold ${resilienceIndex > 0.7 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {resilienceIndex.toFixed(2)}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 mt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT MAP PANEL */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* GEOSPATIAL MAP WORKSPACE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              
              {/* Map Console Header */}
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center space-x-2">
                  <MapIcon className="h-5 w-5 text-orange-500" />
                  <div>
                    <h2 className="text-sm font-bold text-white leading-none">Bengaluru Urban GIS Canvas</h2>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase tracking-wider">
                      Interactive network graph with bezier polylines
                    </p>
                  </div>
                </div>

                {/* Map Control Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  {/* Sat base */}
                  <button
                    onClick={() => setLayers({ ...layers, satellite: !layers.satellite })}
                    className={`px-2.5 py-1 rounded transition-colors ${layers.satellite ? 'bg-orange-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                  >
                    Satellite View
                  </button>
                  {/* Heatmap */}
                  <button
                    onClick={() => setLayers({ ...layers, heatmap: !layers.heatmap })}
                    className={`px-2.5 py-1 rounded transition-colors ${layers.heatmap ? 'bg-orange-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                  >
                    Heatmap Overlay
                  </button>
                  {/* Grid overlay */}
                  <button
                    onClick={() => setLayers({ ...layers, grid: !layers.grid })}
                    className={`px-2.5 py-1 rounded transition-colors ${layers.grid ? 'bg-orange-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                  >
                    Lat/Lng Grid
                  </button>
                </div>
              </div>

              {/* REAL MAP ELEMENT */}
              <div 
                className="relative h-[480px] bg-slate-950 overflow-hidden cursor-crosshair group"
                onMouseMove={handleMapMouseMove}
                id="interactive-map-frame"
              >
                {/* 1. SATELLITE PICTURE MOCK LAYER */}
                {layers.satellite && (
                  <div className="absolute inset-0 z-0 opacity-40 mix-blend-lighten pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950 via-slate-950 to-slate-950" />
                    {/* Generative urban forest circles */}
                    <circle cx="150" cy="180" r="140" fill="#14532d" opacity="0.3" />
                    <circle cx="380" cy="220" r="110" fill="#14532d" opacity="0.3" />
                    <circle cx="280" cy="80" r="80" fill="#14532d" opacity="0.3" />
                  </div>
                )}

                {/* 2. HEATMAP OVERLAY */}
                {layers.heatmap && (
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.22] mix-blend-screen">
                    <circle cx="250" cy="150" r="180" fill="url(#heatGradient1)" />
                    <circle cx="180" cy="40" r="120" fill="url(#heatGradient2)" />
                    <circle cx="400" cy="110" r="140" fill="url(#heatGradient1)" />
                    
                    <defs>
                      <radialGradient id="heatGradient1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#eab308" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="heatGradient2">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </div>
                )}

                {/* 3. COORD GRID OVERLAY */}
                {layers.grid && (
                  <div className="absolute inset-0 z-0 grid grid-cols-8 grid-rows-8 pointer-events-none opacity-[0.06] border-b border-r border-slate-700">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className="border-t border-l border-slate-500 text-[6px] font-mono text-slate-500 p-0.5 select-none" />
                    ))}
                  </div>
                )}

                {/* MOCK MONSOON FLOODING SHAPE OVERLAY */}
                {scenario === 'flood' && (
                  <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                    {/* Pulsing blue transparent flood zone polygon covering south */}
                    <svg className="w-full h-full">
                      <polygon 
                        points="200,220 320,180 480,240 450,340 220,320" 
                        fill="#3b82f6" 
                        fillOpacity="0.18" 
                        stroke="#2563eb" 
                        strokeWidth="1.5" 
                        strokeDasharray="4,4"
                        className="animate-pulse"
                      />
                      <g transform="translate(300, 240)">
                        <rect width="90" height="18" rx="4" fill="#2563eb" fillOpacity="0.85" />
                        <text x="6" y="12" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">FLOOD ZONE</text>
                      </g>
                    </svg>
                  </div>
                )}

                {/* 4. BEZIER ROADS VECTOR LAYER */}
                <svg className="absolute inset-0 w-full h-full z-10 select-none">
                  {/* Render curved road polylines */}
                  {updatedEdges.map(edge => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    // Color coordinate based on criticality & state
                    // If disabled, render as red/dashed path. Else color gradient
                    let color = '#3b82f6'; // default blue
                    if (!edge.active) {
                      color = '#ef4444'; // severed is bright red
                    } else if (edge.criticality === 'high') {
                      color = '#f97316'; // high load orange
                    } else if (edge.criticality === 'medium') {
                      color = '#eab308'; // medium yellow
                    } else {
                      color = '#10b981'; // stable green
                    }

                    const pathString = edge.isCurved && edge.controlX && edge.controlY
                      ? `M ${fromNode.x},${fromNode.y} Q ${edge.controlX},${edge.controlY} ${toNode.x},${toNode.y}`
                      : `M ${fromNode.x},${fromNode.y} L ${toNode.x},${toNode.y}`;

                    return (
                      <g key={edge.id}>
                        {/* Underglow path */}
                        <path
                          d={pathString}
                          fill="none"
                          stroke={color}
                          strokeWidth={edge.active ? "6" : "2"}
                          strokeOpacity={edge.active ? "0.15" : "0.5"}
                        />
                        {/* Core path line */}
                        <path
                          d={pathString}
                          fill="none"
                          stroke={color}
                          strokeWidth={edge.active ? "3" : "1.5"}
                          strokeDasharray={edge.active ? "0" : "4,4"}
                          className={!edge.active ? 'animate-pulse' : ''}
                        />
                      </g>
                    );
                  })}

                  {/* Render alternate blue rerouting lines when crucial nodes are blocked */}
                  {!nodes.find(n => n.id === 'N1')?.active && (
                    <motion.path
                      d="M 110,90 Q 250,30 400,110"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                  )}

                  {/* PLOT NODES */}
                  {nodes.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <g 
                        key={node.id} 
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => toggleNode(node.id)}
                        className="cursor-pointer group"
                      >
                        {/* Hover glow circle */}
                        <circle 
                          r="22" 
                          fill="none" 
                          stroke={node.active ? '#f97316' : '#94a3b8'} 
                          strokeWidth="1.5" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity" 
                        />

                        {/* Node status indicators */}
                        <circle
                          r={node.isCritical ? "12" : "9"}
                          fill={node.active 
                            ? (node.isCritical ? '#f97316' : '#3b82f6')
                            : '#475569'
                          }
                          stroke="#ffffff"
                          strokeWidth="2"
                        />

                        {/* Label name */}
                        <text
                          y={node.isCritical ? "-18" : "-15"}
                          textAnchor="middle"
                          fill={isSelected ? '#f97316' : '#ffffff'}
                          fontSize="9.5"
                          fontWeight={node.isCritical ? "bold" : "normal"}
                          fontFamily="sans-serif"
                          className="bg-slate-950 p-0.5 rounded shadow select-none"
                        >
                          {node.id}
                        </text>

                        {/* Internal X or dot */}
                        {!node.active && (
                          <text
                            dy="3.5"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            X
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* 5. GIS COORDINATE HUD OVERLAY AND LIVE MAP CROSSHAIR */}
                <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 rounded px-3 py-1.5 z-20 font-mono text-[9px] text-slate-300">
                  <div className="flex items-center space-x-1.5 text-orange-400">
                    <Radio className="h-3 w-3 animate-pulse" />
                    <span>COORDINATE SCANNER:</span>
                  </div>
                  <div className="mt-0.5">X: {mouseCoords.x}px | Y: {mouseCoords.y}px</div>
                  <div>LAT: {mouseCoords.lat}</div>
                  <div>LNG: {mouseCoords.lng}</div>
                </div>

                {/* 6. TRAVEL TIME INCREMENT SECTOR POPUP */}
                <AnimatePresence>
                  {selectedNode && !selectedNode.active && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute top-4 right-4 bg-slate-900 border-2 border-red-500 rounded-xl p-4 max-w-[280px] z-20 shadow-2xl"
                      id="sectoral-time-popup"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2 text-red-400">
                          <AlertTriangle className="h-4 w-4" />
                          <h4 className="text-xs font-bold font-mono tracking-wider uppercase">Sector Disrupted</h4>
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                        Ablation of <span className="font-bold text-white">{selectedNode.name}</span> has severed major trunk channels.
                      </p>

                      <div className="bg-slate-950 border border-slate-800 p-2 rounded mt-3 text-center">
                        <span className="block text-[8px] font-mono text-slate-400 uppercase">Estimated Travel Impact</span>
                        <span className="text-lg font-black text-red-400 font-mono">+14 MIN DELAY</span>
                      </div>

                      <div className="text-[9px] text-slate-400 font-mono mt-2.5">
                        &bull; Backup routes engaged: N4 &rarr; N7 outer loop.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>

            {/* INFORMATION SUMMARY BANNER */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">How to test what-if scenarios:</span> Use the right sidebar's drop-down menu to instantly apply pre-baked global conditions (such as Monsoon Flooding or Multi-Node Collapses). Alternatively, toggle individual junctions on the map canvas to evaluate custom localized failures.
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR PANEL */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* SCENARIO CONFIGURATOR CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xs font-bold text-slate-300 font-mono tracking-wider uppercase mb-3.5">
                What-If Scenario Selector
              </h3>

              <div className="space-y-3">
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value as ScenarioType)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 font-sans cursor-pointer"
                  id="scenario-select"
                >
                  <option value="manual">Manual Node Toggle Mode</option>
                  <option value="flood">Monsoon Flood Zone (South)</option>
                  <option value="multi-failure">Multi-Node Core Collapse</option>
                </select>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-[10px] text-slate-400 leading-relaxed">
                  {scenario === 'manual' && 'Interact freely with the GIS Canvas. Left-click any circular node pin to disable it, fracturing its corresponding lines.'}
                  {scenario === 'flood' && 'Simulates deep rainfall inundating Electronic City and Koramangala. The resilience indicator decreases to 0.83.'}
                  {scenario === 'multi-failure' && 'Simulates extreme cascading damage blocking both MG Road and ORR sectors. High adversarial stress state (R: 0.56).'}
                </div>
              </div>
            </div>

            {/* RECHARTS BETWEENNESS CENTRALITY DISTRICTS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xs font-bold text-slate-300 font-mono tracking-wider uppercase mb-4">
                District Centrality Index
              </h3>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} fontStyle="monospace" />
                    <YAxis stroke="#64748b" fontSize={9} fontStyle="monospace" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="centrality" radius={[3, 3, 0, 0]}>
                      {chartData.map((entry, index) => {
                        let fill = '#3b82f6'; // active normal
                        if (!entry.active) fill = '#475569'; // disabled/ablated is grey
                        else if (entry.isCritical) fill = '#f97316'; // active critical
                        return <Cell key={`cell-${index}`} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-2 border-t border-slate-800 pt-2">
                <div className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded bg-orange-500" />
                  <span>Critical node</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded bg-blue-500" />
                  <span>Standard node</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="h-2 w-2 rounded bg-slate-600" />
                  <span>Ablated node</span>
                </div>
              </div>
            </div>

            {/* REAL-TIME ALERTS & ACTION RECOMMENDATIONS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xs font-bold text-slate-300 font-mono tracking-wider uppercase mb-3.5">
                Live Alerts & Actions
              </h3>

              <div className="space-y-3 max-h-52 overflow-y-auto pr-1" id="alerts-scrollbar">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-3 rounded-lg border text-xs leading-relaxed ${
                      alert.type === 'warning' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-200'
                        : alert.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 font-mono text-[9px] text-slate-400">
                      <span>ALERT #{alert.id}</span>
                      <span>{alert.time}</span>
                    </div>
                    <div>{alert.message}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
