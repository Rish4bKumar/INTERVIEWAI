import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCamera } from '@/hooks/useCamera';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import type { VoiceAccent, VoiceGender } from '@/hooks/useVoiceAssistant';
import { AIInterviewer } from '@/utils/aiInterviewer';
import {
  Bot,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Video,
  VideoOff,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import EyeHeadTracker from '@/components/EyeHeadTracker';

interface BehavioralMetrics {
  eyeContactScore: number;
  headMovementScore: number;
  speakingPace: number;
  confidenceScore: number;
  timestamp: number;
}

interface LiveMetricsSnapshot {
  eyeContact: number;
  headStability: number;
  speakingPace: number;
  confidence: number;
}

interface TranscriptEntry {
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

const INITIAL_LIVE_METRICS: LiveMetricsSnapshot = {
  eyeContact: 72,
  headStability: 78,
  speakingPace: 140,
  confidence: 74,
};

const InterviewSession = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const jobField = searchParams.get('field') || 'Software Engineer';
  const rawAccent = searchParams.get('voiceAccent');
  const rawGender = searchParams.get('voiceGender');
  const selectedVoiceAccent: VoiceAccent =
    rawAccent === 'indian' || rawAccent === 'uk' || rawAccent === 'us' ? rawAccent : 'us';
  const selectedVoiceGender: VoiceGender =
    rawGender === 'male' || rawGender === 'female' ? rawGender : 'female';

  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [behavioralMetrics, setBehavioralMetrics] = useState<BehavioralMetrics[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetricsSnapshot>(INITIAL_LIVE_METRICS);

  const aiInterviewerRef = useRef<AIInterviewer | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const analysisIntervalRef = useRef<number | null>(null);
  const interviewStartTimeRef = useRef<number>(0);
  const interviewStreamRef = useRef<MediaStream | null>(null);
  const latestAttentionScoreRef = useRef<number | null>(null);
  const smoothingRef = useRef<LiveMetricsSnapshot>(INITIAL_LIVE_METRICS);
  const isInterviewActiveRef = useRef<boolean>(false);
  const pendingTimeoutsRef = useRef<number[]>([]);
  const isWaitingForResponseRef = useRef(false);
  const lastUserResponseRef = useRef<string>('');
  const speechStatsRef = useRef<{ totalWords: number; firstWordAt: number | null; lastWordAt: number | null }>({
    totalWords: 0,
    firstWordAt: null,
    lastWordAt: null,
  });

  const {
    videoRef,
    canvasRef,
    isActive: isCameraActive,
    error: cameraError,
    startCamera,
    stopCamera,
    analyzeEyeContact,
  } = useCamera();

  const voiceAssistantRef = useRef<{
    isListening: boolean;
    isSpeaking: boolean;
    startListening: () => void;
    stopListening: () => void;
    speak: (text: string) => void;
    stopSpeaking: () => void;
  } | null>(null);

  const clamp = useCallback((value: number, min: number, max: number) => Math.max(min, Math.min(max, value)), []);

  const computeSpeakingPace = useCallback(() => {
    const { totalWords, firstWordAt, lastWordAt } = speechStatsRef.current;
    if (!firstWordAt || !lastWordAt || totalWords < 4) return 140;
    const elapsedMinutes = (lastWordAt - firstWordAt) / 60000;
    if (elapsedMinutes <= 0) return 140;
    return Math.round(clamp(totalWords / elapsedMinutes, 80, 220));
  }, [clamp]);

  const handleAIResponse = useCallback(async (userResponse: string) => {
    if (!aiInterviewerRef.current || !isInterviewActiveRef.current) return;

    try {
      voiceAssistantRef.current?.stopListening();
      const question = await aiInterviewerRef.current.getNextQuestion(userResponse);
      if (!isInterviewActiveRef.current) return;

      setCurrentQuestion(question);
      setTranscript(prev => [
        ...prev,
        { speaker: 'assistant', text: question, timestamp: Date.now() - interviewStartTimeRef.current },
      ]);
      voiceAssistantRef.current?.speak(question);
      isWaitingForResponseRef.current = true;

      const backupTimer = window.setTimeout(() => {
        const currentlyListening = voiceAssistantRef.current?.isListening || false;
        if (isWaitingForResponseRef.current && !currentlyListening && isInterviewActiveRef.current && isMicEnabled) {
          voiceAssistantRef.current?.startListening();
        }
      }, 4000);
      pendingTimeoutsRef.current.push(backupTimer);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please continue.',
        variant: 'destructive',
      });

      const retryTimer = window.setTimeout(() => {
        if (isInterviewActiveRef.current && isMicEnabled) {
          voiceAssistantRef.current?.startListening();
          isWaitingForResponseRef.current = true;
        }
      }, 2000);
      pendingTimeoutsRef.current.push(retryTimer);
    }
  }, [isMicEnabled, toast]);

  const handleUserTranscript = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !isInterviewActiveRef.current) return;
    if (lastUserResponseRef.current === trimmed) return;

    lastUserResponseRef.current = trimmed;
    isWaitingForResponseRef.current = false;

    const words = trimmed.split(/\s+/).filter(Boolean).length;
    if (words > 0) {
      const now = Date.now();
      if (!speechStatsRef.current.firstWordAt) speechStatsRef.current.firstWordAt = now;
      speechStatsRef.current.lastWordAt = now;
      speechStatsRef.current.totalWords += words;
    }

    setTranscript(prev => [
      ...prev,
      { speaker: 'user', text: trimmed, timestamp: Date.now() - interviewStartTimeRef.current },
    ]);

    void handleAIResponse(trimmed);
  }, [handleAIResponse]);

  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoiceAssistant({
    onTranscript: handleUserTranscript,
    onSpeechStart: () => undefined,
    onSpeechEnd: () => undefined,
    voiceAccent: selectedVoiceAccent,
    voiceGender: selectedVoiceGender,
  });

  useEffect(() => {
    voiceAssistantRef.current = {
      isListening,
      isSpeaking,
      startListening,
      stopListening,
      speak,
      stopSpeaking,
    };
  }, [isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking]);

  const startBehavioralAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);

    analysisIntervalRef.current = window.setInterval(() => {
      if (!isInterviewActiveRef.current) return;

      const analysis = analyzeEyeContact();
      const measuredEye = latestAttentionScoreRef.current ?? analysis.score;
      const headStabilityMeasured = clamp(100 - (analysis.headMovement || 0) * 2.8, 45, 100);
      const speakingPace = computeSpeakingPace();
      const paceQuality = clamp(100 - Math.abs(speakingPace - 145) * 1.2, 45, 100);

      const prev = smoothingRef.current;
      const next: LiveMetricsSnapshot = {
        eyeContact: prev.eyeContact * 0.68 + measuredEye * 0.32,
        headStability: prev.headStability * 0.72 + headStabilityMeasured * 0.28,
        speakingPace: prev.speakingPace * 0.75 + speakingPace * 0.25,
        confidence: prev.confidence * 0.7 + (measuredEye * 0.45 + headStabilityMeasured * 0.25 + paceQuality * 0.3) * 0.3,
      };
      smoothingRef.current = next;

      const snapshot: LiveMetricsSnapshot = {
        eyeContact: Math.round(next.eyeContact),
        headStability: Math.round(next.headStability),
        speakingPace: Math.round(next.speakingPace),
        confidence: Math.round(next.confidence),
      };
      setLiveMetrics(snapshot);

      setBehavioralMetrics(prevMetrics => [
        ...prevMetrics,
        {
          eyeContactScore: snapshot.eyeContact,
          headMovementScore: snapshot.headStability,
          speakingPace: snapshot.speakingPace,
          confidenceScore: snapshot.confidence,
          timestamp: Date.now() - interviewStartTimeRef.current,
        },
      ]);
    }, 2000);
  }, [analyzeEyeContact, clamp, computeSpeakingPace]);

  const toggleMicrophone = useCallback(() => {
    const stream = interviewStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const next = !audioTrack.enabled;
    audioTrack.enabled = next;
    setIsMicEnabled(next);

    if (!next) {
      stopListening();
    } else if (isInterviewActiveRef.current && !isSpeaking) {
      startListening();
    }
  }, [isSpeaking, startListening, stopListening]);

  const toggleCamera = useCallback(() => {
    const stream = interviewStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const next = !videoTrack.enabled;
    videoTrack.enabled = next;
    setIsCameraEnabled(next);
  }, []);

  const startInterview = useCallback(async () => {
    try {
      const stream = await startCamera();
      if (!stream) throw new Error('Failed to get camera stream');

      interviewStreamRef.current = stream;
      setIsMicEnabled(stream.getAudioTracks()[0]?.enabled ?? true);
      setIsCameraEnabled(stream.getVideoTracks()[0]?.enabled ?? true);
      latestAttentionScoreRef.current = null;
      speechStatsRef.current = { totalWords: 0, firstWordAt: null, lastWordAt: null };
      smoothingRef.current = INITIAL_LIVE_METRICS;
      setLiveMetrics(INITIAL_LIVE_METRICS);
      setBehavioralMetrics([]);
      setTranscript([]);
      recordedChunksRef.current = [];

      aiInterviewerRef.current = new AIInterviewer(jobField);
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (!videoTrack || !audioTrack) throw new Error('Missing media tracks');

      const recordingStream = new MediaStream();
      recordingStream.addTrack(videoTrack);
      recordingStream.addTrack(audioTrack);

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

      const recorder = new MediaRecorder(recordingStream, { mimeType });
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current = recorder;
      try {
        recorder.start(1000);
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }

      setIsInterviewActive(true);
      isInterviewActiveRef.current = true;
      interviewStartTimeRef.current = Date.now();
      startBehavioralAnalysis();

      let firstQuestion = '';
      try {
        firstQuestion = await aiInterviewerRef.current.getNextQuestion();
      } catch {
        firstQuestion = `Hello. Welcome to your ${jobField} interview. Please introduce yourself and your recent experience.`;
      }

      setCurrentQuestion(firstQuestion);
      setTranscript([{ speaker: 'assistant', text: firstQuestion, timestamp: 0 }]);
      speak(firstQuestion);
      isWaitingForResponseRef.current = true;

      const listenBackup = window.setTimeout(() => {
        if (isWaitingForResponseRef.current && !isListening && isInterviewActiveRef.current && isMicEnabled) {
          startListening();
        }
      }, 3000);
      pendingTimeoutsRef.current.push(listenBackup);

      toast({
        title: 'Interview Started',
        description: 'Session is live. Answer naturally as you would in a real call.',
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err?.message || 'Could not start interview. Check camera and microphone permissions.',
        variant: 'destructive',
      });
    }
  }, [isListening, isMicEnabled, jobField, speak, startBehavioralAnalysis, startCamera, startListening, toast]);

  const endInterview = useCallback(() => {
    setIsInterviewActive(false);
    isInterviewActiveRef.current = false;
    isWaitingForResponseRef.current = false;
    stopListening();
    stopSpeaking();

    pendingTimeoutsRef.current.forEach(id => clearTimeout(id));
    pendingTimeoutsRef.current = [];

    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      } catch {
        // ignore recorder stop race
      }
    }
    setIsRecording(false);

    stopCamera();
    interviewStreamRef.current = null;
    setIsCameraEnabled(false);
    setIsMicEnabled(false);

    navigate('/interview-feedback', {
      state: {
        interviewData: {
          jobField,
          transcript,
          behavioralMetrics,
          duration: Date.now() - interviewStartTimeRef.current,
          recording: recordedChunksRef.current,
        },
      },
    });
  }, [behavioralMetrics, isRecording, jobField, navigate, stopCamera, stopListening, stopSpeaking, transcript]);

  useEffect(() => {
    isInterviewActiveRef.current = isInterviewActive;
  }, [isInterviewActive]);

  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
      pendingTimeoutsRef.current.forEach(id => clearTimeout(id));
      stopCamera();
      stopListening();
      stopSpeaking();
      interviewStreamRef.current = null;
    };
  }, [stopCamera, stopListening, stopSpeaking]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Interview Session: {jobField}</h1>
            <p className="text-muted-foreground">{isInterviewActive ? 'Interview in progress...' : 'Ready to start your call'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Voice: {selectedVoiceAccent.toUpperCase()} accent, {selectedVoiceGender}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl">
                <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraEnabled ? 'opacity-100' : 'opacity-25'}`} />
                  <canvas ref={canvasRef} className="hidden" />

                  <EyeHeadTracker
                    videoElement={videoRef.current}
                    onScore={(score) => {
                      latestAttentionScoreRef.current = score;
                      fetch('http://127.0.0.1:5000/attention-score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score }),
                      }).catch(() => undefined);
                    }}
                  />

                  <div className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm flex items-center gap-2">
                    <Bot className="h-3.5 w-3.5 text-cyan-300" />
                    InterviewAI Live
                  </div>
                  <div className="absolute top-4 right-4 rounded-lg border border-white/20 bg-black/55 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
                    <div className="font-medium">Session Status</div>
                    <div className="mt-1">{isSpeaking ? 'AI speaking' : isListening ? 'Listening' : 'Standby'}</div>
                  </div>

                  {(!isCameraActive || !isCameraEnabled) && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>{isInterviewActive ? 'Camera is turned off' : 'Camera not active'}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-3">
                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    {isRecording ? 'Session recording active' : 'Recording paused'}
                  </div>
                  {!isInterviewActive ? (
                    <Button onClick={startInterview} size="lg" className="min-w-[220px] ml-auto">
                      <Video className="w-5 h-5 mr-2" />
                      Start Interview
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3 ml-auto">
                      <button
                        onClick={toggleMicrophone}
                        className={`h-11 w-11 rounded-full border transition-all ${
                          isMicEnabled ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-rose-600 border-rose-400 text-white hover:bg-rose-500'
                        }`}
                        aria-label={isMicEnabled ? 'Turn microphone off' : 'Turn microphone on'}
                      >
                        {isMicEnabled ? <Mic className="h-5 w-5 mx-auto" /> : <MicOff className="h-5 w-5 mx-auto" />}
                      </button>
                      <button
                        onClick={toggleCamera}
                        className={`h-11 w-11 rounded-full border transition-all ${
                          isCameraEnabled ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-rose-600 border-rose-400 text-white hover:bg-rose-500'
                        }`}
                        aria-label={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                      >
                        {isCameraEnabled ? <Video className="h-5 w-5 mx-auto" /> : <VideoOff className="h-5 w-5 mx-auto" />}
                      </button>
                      <button
                        onClick={endInterview}
                        className="h-11 px-5 rounded-full bg-rose-600 text-white hover:bg-rose-500 transition-colors inline-flex items-center gap-2"
                        aria-label="End interview"
                      >
                        <PhoneOff className="h-5 w-5" />
                        End
                      </button>
                    </div>
                  )}
                </div>
              </Card>

              {currentQuestion && (
                <Card className="p-6">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-6 h-6 text-primary mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Current Question</h3>
                      <p className="text-muted-foreground">{currentQuestion}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Live Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Eye Contact</span>
                      <span className="font-medium">{liveMetrics.eyeContact}%</span>
                    </div>
                    <Progress value={liveMetrics.eyeContact} className="h-2 [&>div]:bg-emerald-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Head Stability</span>
                      <span className="font-medium">{liveMetrics.headStability}%</span>
                    </div>
                    <Progress value={liveMetrics.headStability} className="h-2 [&>div]:bg-cyan-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Speaking Pace</span>
                      <span className="font-medium">{liveMetrics.speakingPace} WPM</span>
                    </div>
                    <Progress value={clamp((liveMetrics.speakingPace / 220) * 100, 0, 100)} className="h-2 [&>div]:bg-amber-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Confidence</span>
                      <span className="font-medium">{liveMetrics.confidence}%</span>
                    </div>
                    <Progress value={liveMetrics.confidence} className="h-2 [&>div]:bg-blue-500" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3">Transcript</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transcript.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transcript yet...</p>
                  ) : (
                    transcript.slice(-6).map((entry, idx) => (
                      <div key={idx} className="text-sm">
                        <span className={`font-medium ${entry.speaker === 'assistant' ? 'text-primary' : 'text-foreground'}`}>
                          {entry.speaker === 'assistant' ? 'AI' : 'You'}:
                        </span>
                        <span className="ml-2 text-muted-foreground">{entry.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>

          {cameraError && (
            <Card className="p-4 mt-4 border-red-500 bg-red-50">
              <p className="text-red-700">{cameraError}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
