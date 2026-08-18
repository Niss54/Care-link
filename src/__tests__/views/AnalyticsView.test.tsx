import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AnalyticsView } from '../../views/AnalyticsView';

// Mock Recharts to prevent ResizeObserver errors in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: () => <div data-testid="BarChart" />,
  Bar: () => <div />,
  LineChart: () => <div data-testid="LineChart" />,
  Line: () => <div />,
  PieChart: () => <div data-testid="PieChart" />,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  RadialBarChart: () => <div data-testid="RadialBarChart" />,
  RadialBar: () => <div />,
  PolarAngleAxis: () => <div />,
  ReferenceDot: () => <div />,
}));

// Provide a ResizeObserver mock just in case
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('AnalyticsView Component', () => {
  it('ROC-AUC metric card renders with value "0.727"', () => {
    render(<AnalyticsView />);
    // Look for 0.727
    const aucElements = screen.queryAllByText('0.727');
    expect(aucElements.length).toBeGreaterThan(0);
  });

  it('Privacy Dashboard shows "0 records" text', () => {
    render(<AnalyticsView />);
    // We expect the Privacy Dashboard to be rendered inside AnalyticsView
    expect(screen.getByText(/0/i)).toBeInTheDocument();
    expect(screen.getByText(/records/i)).toBeInTheDocument();
  });

  it('Hospital nodes show 3 cards', () => {
    render(<AnalyticsView />);
    expect(screen.getByText(/Node 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Node 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Node 3/i)).toBeInTheDocument();
  });
});
