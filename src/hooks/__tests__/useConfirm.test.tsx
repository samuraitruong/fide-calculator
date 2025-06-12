import { renderHook, act } from '@testing-library/react';
import { useConfirm } from '../useConfirm';

describe('useConfirm', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useConfirm());
    
    expect(result.current.isOpen).toBe(false);
    expect(result.current.title).toBe('');
    expect(result.current.message).toBe('');
  });

  it('should open confirmation dialog with provided values', () => {
    const { result } = renderHook(() => useConfirm());
    
    act(() => {
      result.current.openConfirm('Test Title', 'Test Message');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.title).toBe('Test Title');
    expect(result.current.message).toBe('Test Message');
  });

  it('should close confirmation dialog', () => {
    const { result } = renderHook(() => useConfirm());
    
    act(() => {
      result.current.openConfirm('Test Title', 'Test Message');
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeConfirm();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should handle confirmation', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => useConfirm());
    
    act(() => {
      result.current.openConfirm('Test Title', 'Test Message');
    });

    act(() => {
      result.current.handleConfirm(onConfirm);
    });

    expect(onConfirm).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle cancellation', () => {
    const onCancel = jest.fn();
    const { result } = renderHook(() => useConfirm());
    
    act(() => {
      result.current.openConfirm('Test Title', 'Test Message');
    });

    act(() => {
      result.current.handleCancel(onCancel);
    });

    expect(onCancel).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });
}); 