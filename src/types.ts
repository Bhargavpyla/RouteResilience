export type Page = 'home' | 'pipeline' | 'dashboard';

export type PhaseId = 1 | 2 | 3 | 4;

export interface PreprocessingConfig {
  tiling: number;
  contrast: number;
  simulatedOcclusion: boolean;
}

export interface LossMetric {
  name: string;
  value: number; // 0 to 100
}

export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  lat: string;
  lng: string;
  centrality: number;
  active: boolean;
  isCritical: boolean;
  district: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  active: boolean;
  isCurved: boolean;
  controlX?: number;
  controlY?: number;
  criticality: 'low' | 'medium' | 'high';
}

export type ScenarioType = 'manual' | 'flood' | 'multi-failure';

export interface AlertItem {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  time: string;
}
