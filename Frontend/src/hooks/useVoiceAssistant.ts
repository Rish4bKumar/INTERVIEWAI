import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceAccent = 'us' | 'indian' | 'uk';
export type VoiceGender = 'female' | 'male';

interface VoiceAssistantOptions {
  onTranscript: (text: string) => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  voiceAccent?: VoiceAccent;
  voiceGender?: VoiceGender;
}

export const useVoiceAssistant = ({
  onTranscript,
  onSpeechStart,
  onSpeechEnd,
  voiceAccent = 'us',
  voiceGender = 'female',
}: VoiceAssistantOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const accumulatedTranscriptRef = useRef<string>('');
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedAccentRef = useRef<VoiceAccent>(voiceAccent);
  const selectedGenderRef = useRef<VoiceGender>(voiceGender);
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  
  // Update ref when callback changes
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    selectedAccentRef.current = voiceAccent;
  }, [voiceAccent]);

  useEffect(() => {
    selectedGenderRef.current = voiceGender;
  }, [voiceGender]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      availableVoicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const pickBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = availableVoicesRef.current;
    if (voices.length === 0) {
      return null;
    }

    const accent = selectedAccentRef.current;
    const gender = selectedGenderRef.current;
    const accentLangMap: Record<VoiceAccent, string[]> = {
      us: ['en-US'],
      indian: ['en-IN', 'hi-IN'],
      uk: ['en-GB'],
    };
    const preferredLangs = accentLangMap[accent];

    const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'karen', 'zira', 'hazel', 'veena', 'raveena', 'heera', 'aditi'];
    const maleKeywords = ['male', 'man', 'david', 'james', 'daniel', 'mark', 'alex', 'aaron', 'ravi', 'prabhat'];
    const genderKeywords = gender === 'female' ? femaleKeywords : maleKeywords;
    const strongIndianFemale = ['heera', 'aditi', 'swara', 'raveena', 'veena'];
    const strongIndianMale = ['prabhat', 'ravi', 'arjun'];
    const strongIndianTarget = gender === 'female' ? strongIndianFemale : strongIndianMale;

    const scored = voices.map((voice) => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      let score = 0;

      if (preferredLangs.some((code) => lang.startsWith(code.toLowerCase()))) score += 60;
      if (lang.startsWith('en-')) score += 15;
      if (voice.default) score += 8;
      if (genderKeywords.some((keyword) => name.includes(keyword))) score += 25;
      if (accent === 'indian' && strongIndianTarget.some((keyword) => name.includes(keyword))) score += 80;
      if (accent === 'indian' && lang.startsWith('en-in')) score += 20;

      return { voice, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.voice || null;
  }, []);

  const voiceTuning = useCallback(() => {
    const accent = selectedAccentRef.current;
    const gender = selectedGenderRef.current;

    if (accent === 'indian') {
      return gender === 'female'
        ? { rate: 0.9, pitch: 1.18 }
        : { rate: 0.9, pitch: 0.9 };
    }

    return gender === 'female'
      ? { rate: 0.92, pitch: 1.08 }
      : { rate: 0.9, pitch: 0.95 };
  }, []);

  const preferredLang = useCallback(() => {
    const accent = selectedAccentRef.current;
    if (accent === 'indian') return 'en-IN';
    if (accent === 'uk') return 'en-GB';
    return 'en-US';
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return null;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognition = new SpeechRecognitionAPI();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      onSpeechStart();
      // Reset accumulated transcript when starting fresh
      accumulatedTranscriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let newFinalTranscript = '';

      // Process all results from the current result index
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          // Accumulate final results
          newFinalTranscript += transcript + ' ';
        } else {
          // Store interim results for display
          interimTranscript += transcript;
        }
      }

      // Add new final transcript to accumulated
      if (newFinalTranscript.trim()) {
        accumulatedTranscriptRef.current += newFinalTranscript;
        console.log('📝 Accumulated final transcript:', accumulatedTranscriptRef.current.trim());
      }

      // Log interim results for debugging
      if (interimTranscript.trim()) {
        console.log('⏳ Interim transcript:', interimTranscript.trim());
      }

      // If we have accumulated final transcript, process it after a short delay
      // This allows for natural speech pauses without cutting off mid-sentence
      if (accumulatedTranscriptRef.current.trim()) {
        // Clear existing timeout
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }
        
        // Set timeout to process accumulated transcript after 1.5 seconds of silence
        speechTimeoutRef.current = setTimeout(() => {
          if (accumulatedTranscriptRef.current.trim()) {
            console.log('🎯 Processing accumulated transcript after pause:', accumulatedTranscriptRef.current.trim());
            try {
              onTranscriptRef.current(accumulatedTranscriptRef.current.trim());
              console.log('✅ Transcript callback executed successfully');
            } catch (error) {
              console.error('❌ Error in transcript callback:', error);
            }
            accumulatedTranscriptRef.current = ''; // Clear after processing
          }
        }, 1500); // Wait 1.5 seconds of silence before processing
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Clear speech timeout on error
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      
      // Process any accumulated transcript before handling error
      if (accumulatedTranscriptRef.current.trim()) {
        console.log('🎯 Processing accumulated transcript on error:', accumulatedTranscriptRef.current.trim());
        try {
          onTranscriptRef.current(accumulatedTranscriptRef.current.trim());
        } catch (error) {
          console.error('❌ Error in transcript callback:', error);
        }
        accumulatedTranscriptRef.current = '';
      }
      
      if (event.error === 'no-speech') {
        // Don't restart automatically - wait for user to speak
        console.log('No speech detected, waiting...');
      } else if (event.error === 'aborted') {
        // Recognition was stopped, don't restart
        console.log('Recognition aborted');
      } else {
        // For other errors, try to restart
        setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error('Failed to restart recognition:', err);
            }
          }
        }, 1000);
      }
    };

    let shouldRestart = true;
    
    recognition.onend = () => {
      console.log('Speech recognition ended, shouldRestart:', shouldRestart);
      
      // Clear speech timeout
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      
      // Process any accumulated final transcript before ending
      if (accumulatedTranscriptRef.current.trim()) {
        console.log('🎯 Processing accumulated transcript on end:', accumulatedTranscriptRef.current.trim());
        try {
          onTranscriptRef.current(accumulatedTranscriptRef.current.trim());
          console.log('✅ Transcript callback executed successfully');
        } catch (error) {
          console.error('❌ Error in transcript callback:', error);
        }
        accumulatedTranscriptRef.current = ''; // Clear after processing
      }
      
      setIsListening(false);
      onSpeechEnd();
      
      // Auto-restart if it ended unexpectedly (but not if we stopped it intentionally)
      if (shouldRestart && recognitionRef.current) {
        console.log('Auto-restarting speech recognition...');
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error('Auto-restart failed:', err);
            }
          }
        }, 500);
      }
    };
    
    // Store shouldRestart flag in recognition object for access in stopListening
    (recognition as any).shouldRestart = () => shouldRestart;
    (recognition as any).setShouldRestart = (value: boolean) => { shouldRestart = value; };

    return recognition;
  }, [onTranscript, onSpeechStart, onSpeechEnd]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
      if (!recognitionRef.current) {
        console.error('Failed to initialize speech recognition');
        return;
      }
    }

    const recognition = recognitionRef.current as any;
    
    // Mark that we want to restart if it ends
    if (recognition.setShouldRestart) {
      recognition.setShouldRestart(true);
    }

    try {
      // If already listening, don't restart
      if (isListening) {
        console.log('Already listening, skipping start');
        return;
      }
      
      console.log('Starting speech recognition...');
      recognitionRef.current.start();
      
      // Verify it actually started
      setTimeout(() => {
        if (!isListening) {
          console.warn('Recognition may not have started, checking status...');
        }
      }, 500);
    } catch (error: any) {
      console.error('Error starting recognition:', error);
      
      // If error is "already started", that's okay
      if (error.name === 'InvalidStateError' || error.message?.includes('started')) {
        console.log('Recognition already started');
        setIsListening(true);
      } else if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
        console.error('Microphone permission denied');
        alert('Microphone permission is required. Please allow microphone access and try again.');
      } else {
        // Try to restart after a delay
        console.log('Retrying recognition start in 1 second...');
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (retryError) {
              console.error('Retry start failed:', retryError);
            }
          }
        }, 1000);
      }
    }
  }, [initRecognition, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // Mark that we intentionally stopped, so don't auto-restart
      const recognition = recognitionRef.current as any;
      if (recognition.setShouldRestart) {
        recognition.setShouldRestart(false);
      }
      
      try {
        recognitionRef.current.stop();
        console.log('Stopped listening intentionally');
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  }, []);

  // Speak text using browser TTS
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const tuning = voiceTuning();
      utterance.rate = tuning.rate;
      utterance.pitch = tuning.pitch;
      utterance.volume = 1;
      utterance.lang = preferredLang();
      const selectedVoice = pickBestVoice();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
        // Pause listening while AI is speaking
        if (isListening) {
          stopListening();
        }
      };

      utterance.onend = () => {
        console.log('AI speech ended, ready to listen for user response');
        setIsSpeaking(false);
        // Resume listening after AI finishes speaking
        // Wait a bit longer to ensure speech is fully complete
        setTimeout(() => {
          console.log('Starting to listen for user response...');
          startListening();
        }, 1000); // Wait 1 second after AI finishes speaking
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };

      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isListening, pickBestVoice, preferredLang, startListening, stopListening, voiceTuning]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};
