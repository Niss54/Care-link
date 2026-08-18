import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePatients } from '../../hooks/usePatients';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn(),
    }
  }
}));

const mockPatientData = [
  { id: '1', name: 'John Doe', dob: '1980-01-01', gender: 'M', status: 'Active', created_at: '2023-01-01' },
];

describe('usePatients hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('patients list loads on mount', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockQuery = Promise.resolve({ data: mockPatientData, error: null });
    
    // We need to simulate the chain: from().select().order().order()
    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ order: vi.fn().mockReturnValue(mockQuery) });

    const { result } = renderHook(() => usePatients());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.patients).toHaveLength(1);
    expect(result.current.patients[0].name).toBe('John Doe');
    expect(result.current.error).toBeNull();
  });

  it('addPatient updates state optimistically', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    
    // Initial fetch mock
    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ order: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) });

    const { result } = renderHook(() => usePatients());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock add patient
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user123' } } });
    
    const mockInsert = vi.fn().mockReturnThis();
    const mockInsertSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ 
      data: { id: '2', name: 'Jane Doe', status: 'Active', created_at: '2023-01-02' }, 
      error: null 
    });
    
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });
    mockInsert.mockReturnValue({ select: mockInsertSelect });
    mockInsertSelect.mockReturnValue({ single: mockSingle });

    await act(async () => {
      await result.current.addPatient({
        name: 'Jane Doe', dob: '1990-01-01', gender: 'F', status: 'Active',
        lastVisit: '', avatarUrl: '', email: '', phone: '', department: '', notes: '', initials: 'JD', dateAdded: '', external_ref: ''
      } as any);
    });

    expect(result.current.patients).toHaveLength(1);
    expect(result.current.patients[0].name).toBe('Jane Doe');
  });

  it('deletePatient removes patient from state', async () => {
    // Initial fetch mock
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ order: vi.fn().mockReturnValue(Promise.resolve({ data: mockPatientData, error: null })) });

    const { result } = renderHook(() => usePatients());
    await waitFor(() => expect(result.current.patients.length).toBe(1));

    // Mock delete
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({
      delete: mockDelete,
    });
    mockDelete.mockReturnValue({ eq: mockEq });

    await act(async () => {
      await result.current.deletePatient('1');
    });

    expect(result.current.patients).toHaveLength(0);
  });

  it('error state set on Supabase failure', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ order: vi.fn().mockReturnValue(Promise.resolve({ data: null, error: { message: 'Database error' } })) });

    const { result } = renderHook(() => usePatients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database error');
  });
});
