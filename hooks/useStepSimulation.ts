import { useState, useEffect, useCallback, useRef } from 'react';
import { StepHistoryPoint } from '../types';

const STORAGE_KEY_STEPS = 'stepmaster_steps';
const STORAGE_KEY_DATE = 'stepmaster_date';
const STORAGE_KEY_HISTORY = 'stepmaster_history';

export const useStepSimulation = () => {
  const [steps, setSteps] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [activityStatus, setActivityStatus] = useState<'IDLE' | 'WALKING' | 'RUNNING'>('IDLE');
  const [history, setHistory] = useState<StepHistoryPoint[]>([]);
  
  // Refs for interval management to avoid dependency loops
  const stepsRef = useRef(steps);
  const isSimulatingRef = useRef(isSimulating);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    isSimulatingRef.current = isSimulating;
  }, [isSimulating]);

  // 同步当前步数到后端 JSON 文件（通过本地 Node 服务）
  useEffect(() => {
    // 初始化阶段 steps 可能是 0，这里仍然同步，方便外部始终有文件
    const controller = new AbortController();

    const syncSteps = async () => {
      try {
        await fetch('/api/steps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            steps,
            status: activityStatus,
          }),
          signal: controller.signal,
        });
      } catch {
        // 如果后端没启动或网络错误，静默忽略，不影响前端展示
      }
    };

    syncSteps();

    return () => controller.abort();
  }, [steps, activityStatus]);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedSteps = localStorage.getItem(STORAGE_KEY_STEPS);
    const savedDate = localStorage.getItem(STORAGE_KEY_DATE);
    const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    
    const today = new Date().toDateString();

    if (savedDate !== today) {
      // New day, reset
      setSteps(0);
      setHistory([]);
      localStorage.setItem(STORAGE_KEY_DATE, today);
    } else {
      if (savedSteps) setSteps(parseInt(savedSteps, 10));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save to LocalStorage whenever steps change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STEPS, steps.toString());
  }, [steps]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  // Simulation Logic
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      if (!isSimulatingRef.current) {
        setActivityStatus('IDLE');
        return;
      }

      const randomChance = Math.random();
      const currentHour = new Date().getHours();
      
      // Night time (0-6 AM) lower chance of movement
      const isNight = currentHour >= 0 && currentHour < 6;
      const activityThreshold = isNight ? 0.95 : 0.6; 

      if (randomChance > activityThreshold) {
        // Active
        const isRunning = Math.random() > 0.8;
        const addedSteps = isRunning ? Math.floor(Math.random() * 8) + 4 : Math.floor(Math.random() * 3) + 1;
        
        setActivityStatus(isRunning ? 'RUNNING' : 'WALKING');
        
        setSteps(prev => {
          const newValue = prev + addedSteps;
          return newValue;
        });

      } else {
        setActivityStatus('IDLE');
      }

      // Check for day reset periodically
      const today = new Date().toDateString();
      const savedDate = localStorage.getItem(STORAGE_KEY_DATE);
      if (savedDate !== today) {
        setSteps(0);
        setHistory([]);
        localStorage.setItem(STORAGE_KEY_DATE, today);
      }

    }, 2000); // Check every 2 seconds

    return () => clearInterval(simulationInterval);
  }, []);

  // History tracking (every 10 minutes or manually triggered)
  useEffect(() => {
    const trackInterval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setHistory(prev => {
        const newHistory = [...prev, { time: timeStr, steps: stepsRef.current }];
        // Keep last 24 points
        if (newHistory.length > 24) return newHistory.slice(newHistory.length - 24);
        return newHistory;
      });
    }, 60000 * 5); // Every 5 minutes

    return () => clearInterval(trackInterval);
  }, []);

  const addSteps = useCallback((amount: number) => {
    setSteps(prev => prev + amount);
  }, []);

  const setExactSteps = useCallback((amount: number) => {
    setSteps(amount);
  }, []);

  return {
    steps,
    isSimulating,
    setIsSimulating,
    activityStatus,
    history,
    addSteps,
    setExactSteps
  };
};