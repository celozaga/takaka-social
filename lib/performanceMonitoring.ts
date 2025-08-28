import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Platform } from 'react-native';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  platform: string;
  route?: string;
  metadata?: Record<string, any>;
}

interface ComponentMetric {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  lastUpdate: number;
  props?: Record<string, any>;
}

interface NetworkMetric {
  url: string;
  method: string;
  duration: number;
  status: number;
  size?: number;
  timestamp: number;
}

interface MemoryMetric {
  used: number;
  total: number;
  timestamp: number;
  platform: string;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  components: ComponentMetric[];
  network: NetworkMetric[];
  memory: MemoryMetric[];
  summary: {
    avgRenderTime: number;
    avgNetworkTime: number;
    memoryUsage: number;
    errorCount: number;
    sessionDuration: number;
  };
}

/**
 * Performance Monitor - Cross-platform
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private componentMetrics: Map<string, ComponentMetric> = new Map();
  private networkMetrics: NetworkMetric[] = [];
  private memoryMetrics: MemoryMetric[] = [];
  private sessionStart: number = Date.now();
  private isEnabled: boolean = true;
  private maxMetrics: number = 1000;
  private reportInterval: number = 30000; // 30 seconds
  private reportTimer: number | null = null;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.startPeriodicReporting();
    this.setupMemoryMonitoring();
  }

  private startPeriodicReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.reportTimer = setInterval(() => {
      this.collectMemoryMetrics();
      this.cleanupOldMetrics();
    }, this.reportInterval);
  }

  private setupMemoryMonitoring(): void {
    if (Platform.OS === 'web' && 'memory' in performance) {
      // Web platform memory monitoring
      setInterval(() => {
        this.collectWebMemoryMetrics();
      }, 10000);
    }
  }

  private collectWebMemoryMetrics(): void {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.addMemoryMetric({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        timestamp: Date.now(),
        platform: Platform.OS,
      });
    }
  }

  private collectMemoryMetrics(): void {
    if (Platform.OS === 'web') {
      this.collectWebMemoryMetrics();
    } else {
      // For mobile platforms, we can't directly access memory
      // but we can track component counts and other indicators
      this.addMemoryMetric({
        used: this.componentMetrics.size,
        total: this.maxMetrics,
        timestamp: Date.now(),
        platform: Platform.OS,
      });
    }
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.networkMetrics = this.networkMetrics.filter(m => m.timestamp > cutoff);
    this.memoryMetrics = this.memoryMetrics.filter(m => m.timestamp > cutoff);
    
    // Keep only recent component metrics
    this.componentMetrics.forEach((metric, key) => {
      if (metric.lastUpdate < cutoff) {
        this.componentMetrics.delete(key);
      }
    });
  }

  addMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'platform'>): void {
    if (!this.isEnabled) return;

    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
      platform: Platform.OS,
    });

    // Limit metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  addComponentMetric(metric: ComponentMetric): void {
    if (!this.isEnabled) return;

    const existing = this.componentMetrics.get(metric.componentName);
    if (existing) {
      existing.renderTime = (existing.renderTime + metric.renderTime) / 2; // Average
      existing.updateCount += 1;
      existing.lastUpdate = Date.now();
    } else {
      this.componentMetrics.set(metric.componentName, {
        ...metric,
        lastUpdate: Date.now(),
      });
    }
  }

  addNetworkMetric(metric: NetworkMetric): void {
    if (!this.isEnabled) return;

    this.networkMetrics.push(metric);
    
    // Limit network metrics
    if (this.networkMetrics.length > this.maxMetrics) {
      this.networkMetrics = this.networkMetrics.slice(-this.maxMetrics);
    }
  }

  addMemoryMetric(metric: MemoryMetric): void {
    if (!this.isEnabled) return;

    this.memoryMetrics.push(metric);
    
    // Limit memory metrics
    if (this.memoryMetrics.length > 100) {
      this.memoryMetrics = this.memoryMetrics.slice(-100);
    }
  }

  measureRenderTime<T>(componentName: string, renderFn: () => T): T {
    if (!this.isEnabled) return renderFn();

    const start = this.getHighResTime();
    const result = renderFn();
    const end = this.getHighResTime();
    
    this.addComponentMetric({
      componentName,
      renderTime: end - start,
      mountTime: 0,
      updateCount: 1,
      lastUpdate: Date.now(),
    });
    
    return result;
  }

  async measureAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isEnabled) return operation();

    const start = this.getHighResTime();
    try {
      const result = await operation();
      const end = this.getHighResTime();
      
      this.addMetric({
        name: operationName,
        value: end - start,
        metadata: { ...metadata, status: 'success' },
      });
      
      return result;
    } catch (error) {
      const end = this.getHighResTime();
      
      this.addMetric({
        name: operationName,
        value: end - start,
        metadata: { ...metadata, status: 'error', error: error.message },
      });
      
      throw error;
    }
  }

  private getHighResTime(): number {
    if (Platform.OS === 'web' && 'performance' in window) {
      return performance.now();
    }
    return Date.now();
  }

  generateReport(): PerformanceReport {
    const now = Date.now();
    const sessionDuration = now - this.sessionStart;
    
    // Calculate averages
    const renderTimes = Array.from(this.componentMetrics.values()).map(m => m.renderTime);
    const avgRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length 
      : 0;
    
    const networkTimes = this.networkMetrics.map(m => m.duration);
    const avgNetworkTime = networkTimes.length > 0
      ? networkTimes.reduce((a, b) => a + b, 0) / networkTimes.length
      : 0;
    
    const latestMemory = this.memoryMetrics[this.memoryMetrics.length - 1];
    const memoryUsage = latestMemory ? (latestMemory.used / latestMemory.total) * 100 : 0;
    
    const errorCount = this.metrics.filter(m => 
      m.metadata?.status === 'error'
    ).length;
    
    return {
      metrics: [...this.metrics],
      components: Array.from(this.componentMetrics.values()),
      network: [...this.networkMetrics],
      memory: [...this.memoryMetrics],
      summary: {
        avgRenderTime,
        avgNetworkTime,
        memoryUsage,
        errorCount,
        sessionDuration,
      },
    };
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  getSlowComponents(threshold: number = 16): ComponentMetric[] {
    return Array.from(this.componentMetrics.values())
      .filter(m => m.renderTime > threshold)
      .sort((a, b) => b.renderTime - a.renderTime);
  }

  getSlowNetworkRequests(threshold: number = 1000): NetworkMetric[] {
    return this.networkMetrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  clear(): void {
    this.metrics = [];
    this.componentMetrics.clear();
    this.networkMetrics = [];
    this.memoryMetrics = [];
    this.sessionStart = Date.now();
  }

  destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
    this.clear();
  }
}

/**
 * Hook for component performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  const mountTime = useRef(Date.now());
  const renderCount = useRef(0);

  useEffect(() => {
    const mountDuration = Date.now() - mountTime.current;
    monitor.addComponentMetric({
      componentName,
      renderTime: 0,
      mountTime: mountDuration,
      updateCount: 0,
      lastUpdate: Date.now(),
    });

    return () => {
      // Component unmount
      monitor.addMetric({
        name: 'component-unmount',
        value: Date.now() - mountTime.current,
        metadata: { componentName },
      });
    };
  }, [componentName, monitor]);

  const measureRender = useCallback(<T>(renderFn: () => T): T => {
    renderCount.current += 1;
    return monitor.measureRenderTime(componentName, renderFn);
  }, [componentName, monitor]);

  const addMetric = useCallback((name: string, value: number, metadata?: Record<string, any>) => {
    monitor.addMetric({
      name: `${componentName}-${name}`,
      value,
      metadata: { ...metadata, componentName },
    });
  }, [componentName, monitor]);

  return {
    measureRender,
    addMetric,
    renderCount: renderCount.current,
  };
}

/**
 * Hook for network performance monitoring
 */
export function useNetworkMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const measureRequest = useCallback(async <T>(
    url: string,
    method: string,
    requestFn: () => Promise<T>
  ): Promise<T> => {
    const start = Date.now();
    
    try {
      const result = await requestFn();
      const duration = Date.now() - start;
      
      monitor.addNetworkMetric({
        url,
        method,
        duration,
        status: 200, // Assume success
        timestamp: Date.now(),
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      monitor.addNetworkMetric({
        url,
        method,
        duration,
        status: 500, // Assume error
        timestamp: Date.now(),
      });
      
      throw error;
    }
  }, [monitor]);

  return {
    measureRequest,
  };
}

/**
 * Hook for performance analytics
 */
export function usePerformanceAnalytics() {
  const monitor = PerformanceMonitor.getInstance();
  const [report, setReport] = useState<PerformanceReport | null>(null);

  const generateReport = useCallback(() => {
    const newReport = monitor.generateReport();
    setReport(newReport);
    return newReport;
  }, [monitor]);

  const getSlowComponents = useCallback((threshold?: number) => {
    return monitor.getSlowComponents(threshold);
  }, [monitor]);

  const getSlowRequests = useCallback((threshold?: number) => {
    return monitor.getSlowNetworkRequests(threshold);
  }, [monitor]);

  const clearMetrics = useCallback(() => {
    monitor.clear();
    setReport(null);
  }, [monitor]);

  return {
    report,
    generateReport,
    getSlowComponents,
    getSlowRequests,
    clearMetrics,
  };
}

/**
 * Performance monitoring HOC
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const MonitoredComponent = (props: P) => {
    const { measureRender } = usePerformanceMonitor(displayName);
    
    return measureRender(() => React.createElement(WrappedComponent, props));
  };
  
  MonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return MonitoredComponent;
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(options?: {
  enabled?: boolean;
  maxMetrics?: number;
  reportInterval?: number;
}): PerformanceMonitor {
  const monitor = PerformanceMonitor.getInstance();
  
  if (options?.enabled === false) {
    monitor.disable();
  }
  
  return monitor;
}

export default PerformanceMonitor;