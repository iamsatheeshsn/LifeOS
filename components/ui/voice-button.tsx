'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Send } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import { Portal } from '@/components/ui/portal';

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function VoiceButton() {
  const { voiceOpen, setVoiceOpen } = useAppStore();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!voiceOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVoiceOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [voiceOpen, setVoiceOpen]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user' as const, content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setTranscript('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'AI is unavailable. Check your API key in .env.local.' },
        ]);
        return;
      }

      const assistantMsg = { role: 'assistant' as const, content: data.response || 'Sorry, I could not process that.' };
      setMessages((prev) => [...prev, assistantMsg]);
      speak(assistantMsg.content);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setVoiceOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full gradient-primary shadow-lg shadow-indigo-500/30"
        aria-label="Open voice assistant"
      >
        <Mic className="h-5 w-5 text-white" />
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background" />
      </motion.button>

      <Portal>
        <AnimatePresence>
          {voiceOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
                onClick={() => setVoiceOpen(false)}
              />
              <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col justify-end px-4 pb-6">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="pointer-events-auto mx-auto w-full max-w-lg"
                >
                  <div
                    className="glass-card rounded-3xl p-5 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Voice Assistant</h3>
                    <button
                      onClick={() => setVoiceOpen(false)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mb-4 max-h-60 space-y-3 overflow-y-auto">
                    {messages.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground">
                        Tap the mic and speak, or type a message below.
                      </p>
                    )}
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          'rounded-xl px-3 py-2 text-sm',
                          msg.role === 'user'
                            ? 'ml-8 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                            : 'mr-8 bg-muted'
                        )}
                      >
                        {msg.content}
                      </div>
                    ))}
                    {loading && (
                      <div className="mr-8 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                        Thinking...
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={listening ? stopListening : startListening}
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all',
                        listening
                          ? 'animate-pulse-soft bg-red-500 text-white'
                          : 'gradient-primary text-white'
                      )}
                      aria-label={listening ? 'Stop listening' : 'Start listening'}
                    >
                      {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    <input
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage(transcript)}
                      placeholder="Type or speak..."
                      className="input-field flex-1"
                    />
                    <button
                      onClick={() => sendMessage(transcript)}
                      disabled={!transcript.trim() || loading}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary text-white disabled:opacity-50"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
