export interface StepHistoryPoint {
  time: string;
  steps: number;
}

export interface StepData {
  totalSteps: number;
  lastUpdated: string;
  status: 'IDLE' | 'WALKING' | 'RUNNING';
}

export interface ApiError {
  error: string;
  code: number;
}