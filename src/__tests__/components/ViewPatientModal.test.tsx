import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewPatientModal } from '../../components/Modals/ViewPatientModal';

// Mock dependencies
const mockSubmitFeedback = vi.fn();
vi.mock('../../lib/riskService', () => ({
  usePrediction: vi.fn(() => ({
    risk: { 
      riskTier: 'High', 
      probability: 0.84,
      topFactors: [{ feature: 'Age', impact: 0.1 }]
    },
    loading: false,
    submitFeedback: mockSubmitFeedback,
  })),
}));

const mockCallTriage = vi.fn().mockResolvedValue({
  urgencyLevel: 'URGENT',
  clinicalSummary: 'Patient needs attention',
  primaryConcerns: [],
  recommendedActions: [],
});

vi.mock('../../lib/api', () => ({
  callTriage: (...args: any) => mockCallTriage(...args),
  getUrgencyColor: vi.fn(() => 'text-orange-500 bg-orange-100'),
}));

const mockPatient: any = {
  id: '123',
  name: 'John Doe',
  dob: '1980-01-01',
  gender: 'M',
};

describe('ViewPatientModal Component', () => {
  const defaultProps = {
    patient: mockPatient,
    onClose: vi.fn(),
    medications: [],
    vitalRecords: [],
    appointments: [],
    onRefillMedication: vi.fn(),
    onArchiveMedication: vi.fn(),
    onAddMedication: vi.fn(),
    onAddVitalRecord: vi.fn(),
    onUpdatePatientNotes: vi.fn(),
    onShowToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitFeedback.mockResolvedValue(true);
  });

  it('modal closes on X click', () => {
    render(<ViewPatientModal {...defaultProps} />);
    const closeBtn = screen.getByLabelText('Close modal');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('Confirm Prediction button calls submitClinicalFeedback', async () => {
    render(<ViewPatientModal {...defaultProps} />);
    const confirmBtn = screen.getByText('Confirm Prediction');
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith('confirmed', '');
    });
  });

  it('Override Prediction shows inline form', () => {
    render(<ViewPatientModal {...defaultProps} />);
    const overrideBtn = screen.getByText('Override Prediction');
    fireEvent.click(overrideBtn);
    
    expect(screen.getByPlaceholderText(/Reason for overriding/i)).toBeInTheDocument();
    expect(screen.getByText('Submit Override')).toBeInTheDocument();
  });

  it('SHAP factors list renders when topFactors provided', () => {
    render(<ViewPatientModal {...defaultProps} />);
    // The feature "Age" from our mock should be present
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('"Run AI Triage" button calls callTriage and displays result', async () => {
    // Override the mock to not show triage initially if needed,
    // but the component might show the button initially
    render(<ViewPatientModal {...defaultProps} />);
    
    const triageBtn = screen.getByText('Run AI Triage');
    fireEvent.click(triageBtn);
    
    expect(mockCallTriage).toHaveBeenCalledWith(mockPatient);
    
    await waitFor(() => {
      expect(screen.getByText('Patient needs attention')).toBeInTheDocument();
    });
  });
});
