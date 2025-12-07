/**
 * useAiChat Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAiChat } from './use-ai-chat';
import { aiApi } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual('@/lib/api');
  return {
    ...actual,
    aiApi: {
      chat: vi.fn(),
    },
  };
});

/**
 * Helper to create a mock ReadableStream that emits SSE-formatted chunks
 */
function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(new TextEncoder().encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

describe('useAiChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useAiChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.input).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('setInput updates input state', () => {
    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Hello AI');
    });

    expect(result.current.input).toBe('Hello AI');
  });

  it('sendMessage does not send if input is empty', async () => {
    const { result } = renderHook(() => useAiChat());

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(vi.mocked(aiApi.chat)).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it('sendMessage does not send if input is only whitespace', async () => {
    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('   ');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(vi.mocked(aiApi.chat)).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it('sendMessage does not send if already loading', async () => {
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Hello"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('First message');
    });

    // Start first message (don't await)
    act(() => {
      void result.current.sendMessage();
    });

    // Try to send second message while first is loading
    act(() => {
      result.current.setInput('Second message');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    // Should only be called once
    expect(vi.mocked(aiApi.chat)).toHaveBeenCalledTimes(1);
  });

  it('sendMessage adds user message to messages', async () => {
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Response"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Hello AI');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    expect(result.current.messages[0]).toEqual({
      role: 'user',
      content: 'Hello AI',
    });
  });

  it('sendMessage clears input after sending', async () => {
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Response"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Hello AI');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.input).toBe('');
  });

  it('sendMessage adds assistant placeholder message', async () => {
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Response"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Hello AI');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    expect(result.current.messages[1].role).toBe('assistant');
  });

  it('sendMessage handles streaming response with text-delta events', async () => {
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Hello"}\n\n',
      'data: {"type":"text-delta","text":" there"}\n\n',
      'data: {"type":"text-delta","text":"!"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Hello AI');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.messages[1].content).toBe('Hello there!');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toEqual({
      role: 'assistant',
      content: 'Hello there!',
    });
  });

  it('sendMessage handles multiple lines in a single chunk', async () => {
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"First"}\n\ndata: {"type":"text-delta","text":" Second"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Test');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.messages[1].content).toBe('First Second');
    });
  });

  it('sendMessage handles errors and sets error state', async () => {
    const error = new Error('API Error');
    vi.mocked(aiApi.chat).mockRejectedValue(error);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Hello AI');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('API Error');
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sendMessage removes assistant placeholder on error', async () => {
    const error = new Error('API Error');
    vi.mocked(aiApi.chat).mockRejectedValue(error);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Hello AI');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Should only have the user message, assistant placeholder removed
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
  });

  it('isLoading is true while sending message', async () => {
    let resolveStream: (value: ReadableStream<Uint8Array>) => void;
    const streamPromise = new Promise<ReadableStream<Uint8Array>>((resolve) => {
      resolveStream = resolve;
    });

    vi.mocked(aiApi.chat).mockReturnValue(streamPromise);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Hello AI');
    });

    act(() => {
      void result.current.sendMessage();
    });

    // Should be loading immediately
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the stream
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Response"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    await act(async () => {
      resolveStream(mockStream);
    });

    // Should not be loading after completion
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('clearMessages resets all state', async () => {
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Response"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    const { result } = renderHook(() => useAiChat());

    // Send a message first
    act(() => {
      result.current.setInput('Hello AI');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    // Set some input
    act(() => {
      result.current.setInput('New input');
    });

    // Clear everything
    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.input).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('sendMessage passes messages to API correctly', async () => {
    // Create separate streams for each call
    const mockStream1 = createMockStream([
      'data: {"type":"text-delta","text":"Response"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    const mockStream2 = createMockStream([
      'data: {"type":"text-delta","text":"Second response"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":15,"outputTokens":8}}\n\n',
    ]);

    vi.mocked(aiApi.chat)
      .mockResolvedValueOnce(mockStream1)
      .mockResolvedValueOnce(mockStream2);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('First message');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    // Send second message
    act(() => {
      result.current.setInput('Second message');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(vi.mocked(aiApi.chat)).toHaveBeenCalledTimes(2);
    });

    // Check the second call includes previous messages
    const secondCall = vi.mocked(aiApi.chat).mock.calls[1][0];
    expect(secondCall.messages).toHaveLength(3); // First user, first assistant, second user
    expect(secondCall.messages[0].content).toBe('First message');
    expect(secondCall.messages[1].content).toBe('Response');
    expect(secondCall.messages[2].content).toBe('Second message');
  });

  it('sendMessage handles non-Error exceptions', async () => {
    vi.mocked(aiApi.chat).mockRejectedValue('String error');

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Hello AI');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to send message');
    });
  });

  it('sendMessage ignores invalid JSON in SSE stream', async () => {
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Valid"}\n\n',
      'data: {invalid json}\n\n',
      'data: {"type":"text-delta","text":" text"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Test');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.messages[1].content).toBe('Valid text');
    });

    // Should not have error despite invalid JSON
    expect(result.current.error).toBeNull();
  });

  it('sendMessage handles finish event with usage data', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Response"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":100,"outputTokens":50}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('Test');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('AI usage:', {
      inputTokens: 100,
      outputTokens: 50,
    });

    consoleLogSpy.mockRestore();
  });

  it('sendMessage trims whitespace from user input', async () => {
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Response"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('  Hello AI  ');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    expect(result.current.messages[0].content).toBe('Hello AI');
  });

  it('sendMessage clears error state on new message', async () => {
    // First message fails
    vi.mocked(aiApi.chat).mockRejectedValueOnce(new Error('First error'));

    const { result } = renderHook(() => useAiChat());

    act(() => {
      result.current.setInput('First message');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });

    // Second message succeeds
    const mockStream = createMockStream([
      'data: {"type":"text-delta","text":"Success"}\n\n',
      'data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":5}}\n\n',
    ]);

    vi.mocked(aiApi.chat).mockResolvedValue(mockStream);

    act(() => {
      result.current.setInput('Second message');
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});

