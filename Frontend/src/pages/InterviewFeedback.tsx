import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Headphones,
  MessageSquare,
  TrendingUp,
  Download,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  getInterviewHistoryRecordById,
  saveInterviewHistoryRecord,
  type AIFeedbackSummary,
  type BehavioralMetrics,
  type InterviewData,
  type TranscriptEntry,
} from "@/utils/interviewHistory";

const InterviewFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();

  const stateInterviewData = location.state?.interviewData as InterviewData | undefined;
  const historyId = searchParams.get("historyId");

  const [interviewData, setInterviewData] = useState<InterviewData | null>(stateInterviewData || null);
  const [aiFeedback, setAiFeedback] = useState<AIFeedbackSummary | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(true);
  const hasSavedHistoryRef = useRef(false);

  useEffect(() => {
    if (stateInterviewData) {
      setInterviewData(stateInterviewData);
      return;
    }
    if (!historyId || !user?.id) {
      setLoadingAI(false);
      return;
    }

    const savedRecord = getInterviewHistoryRecordById(user.id, historyId);
    if (!savedRecord) {
      setLoadingAI(false);
      return;
    }

    setInterviewData(savedRecord.interviewData);
    setAiFeedback(savedRecord.aiFeedback);
    setLoadingAI(false);
  }, [historyId, stateInterviewData, user?.id]);

  useEffect(() => {
    if (!interviewData || aiFeedback || historyId) return;

    const fetchAIFeedback = async () => {
      try {
        setLoadingAI(true);
        const res = await fetch("http://localhost:5000/ai-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: interviewData.transcript,
            jobField: interviewData.jobField,
            behavioralMetrics: interviewData.behavioralMetrics,
            duration: interviewData.duration,
          }),
        });

        const data = await res.json();
        setAiFeedback(data.feedback || null);
      } catch {
        setAiFeedback(null);
      } finally {
        setLoadingAI(false);
      }
    };

    void fetchAIFeedback();
  }, [aiFeedback, historyId, interviewData]);

  useEffect(() => {
    if (!user?.id || !interviewData || !aiFeedback || hasSavedHistoryRef.current || !!historyId) {
      return;
    }
    saveInterviewHistoryRecord(user.id, interviewData, aiFeedback);
    hasSavedHistoryRef.current = true;
  }, [aiFeedback, historyId, interviewData, user?.id]);

  const avgMetrics = useMemo(() => {
    const source = interviewData?.behavioralMetrics || [];
    if (source.length === 0) {
      return { eyeContact: 100, headMovement: 100, speakingPace: 120, confidence: 100 };
    }

    const sum = source.reduce(
      (acc, metric) => ({
        eyeContact: acc.eyeContact + metric.eyeContactScore,
        headMovement: acc.headMovement + metric.headMovementScore,
        speakingPace: acc.speakingPace + metric.speakingPace,
        confidence: acc.confidence + metric.confidenceScore,
      }),
      { eyeContact: 0, headMovement: 0, speakingPace: 0, confidence: 0 },
    );

    return {
      eyeContact: sum.eyeContact / source.length,
      headMovement: sum.headMovement / source.length,
      speakingPace: sum.speakingPace / source.length,
      confidence: sum.confidence / source.length,
    };
  }, [interviewData?.behavioralMetrics]);

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const downloadTranscript = () => {
    if (!interviewData) return;
    const text = interviewData.transcript
      .map((entry) => {
        const time = formatDuration(entry.timestamp);
        const speaker = entry.speaker === "assistant" ? "AI" : "You";
        return `[${time}] ${speaker}: ${entry.text}`;
      })
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-transcript-${interviewData.jobField}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!interviewData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-3xl font-bold mb-4">No Interview Data Found</h2>
          <p className="text-muted-foreground mb-4">Start a new interview or open one from Dashboard history.</p>
          <Button onClick={() => navigate("/interview-setup")}>Start New Interview</Button>
        </div>
      </div>
    );
  }

  const { jobField, transcript, behavioralMetrics, duration } = interviewData;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Interview Feedback</h1>
              <p className="text-muted-foreground">
                {jobField} - Duration: {formatDuration(duration)}
              </p>
            </div>

            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 border-2 border-primary">
                <h2 className="text-2xl font-bold mb-4 text-primary">AI Powered Feedback</h2>

                {loadingAI && <p className="text-muted-foreground">Analyzing your interview...</p>}

                {!loadingAI && aiFeedback && (
                  <div className="space-y-6 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <ScoreTile label="Overall Score" value={aiFeedback.overall_score} className="bg-primary/10" />
                      <ScoreTile label="Job Match" value={aiFeedback.job_match_score} className="bg-blue-50 text-blue-700" />
                      <ScoreTile label="Communication" value={aiFeedback.communication_score} className="bg-green-50 text-green-700" />
                      <ScoreTile label="Behavior" value={aiFeedback.behavior_score} className="bg-yellow-50 text-yellow-700" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <ListBlock title="Strengths" items={aiFeedback.strengths || []} tone="good" />
                      <ListBlock title="Weaknesses" items={aiFeedback.weaknesses || []} tone="bad" />
                    </div>

                    <ListBlock title="Recommendations" items={aiFeedback.recommendations || []} tone="neutral" />

                    {aiFeedback.final_verdict && (
                      <div className="p-4 border rounded-lg bg-primary/10 text-primary text-center text-xl font-bold">
                        {aiFeedback.final_verdict}
                      </div>
                    )}
                  </div>
                )}

                {!loadingAI && !aiFeedback && (
                  <p className="text-muted-foreground">AI feedback is unavailable for this interview.</p>
                )}
              </Card>

              <Card className="p-6 bg-gradient-to-r from-primary/10 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Behavioral Performance</h2>
                    <p className="text-muted-foreground">Based on camera + voice behavioral analysis</p>
                  </div>

                  <div className="text-5xl font-extrabold text-primary">
                    {Math.round((avgMetrics.eyeContact + avgMetrics.confidence + avgMetrics.headMovement) / 3)}%
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Behavioral Analysis
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <MetricBar label="Eye Contact" value={avgMetrics.eyeContact} icon={<Eye className="w-4 h-4 text-primary" />} />
                  <MetricBar label="Confidence" value={avgMetrics.confidence} icon={<Headphones className="w-4 h-4 text-primary" />} />
                  <MetricBar label="Head Movement" value={avgMetrics.headMovement} />
                  <SpeakingPace value={avgMetrics.speakingPace} />
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Transcript
                  </h2>
                  <Button size="sm" variant="outline" onClick={downloadTranscript}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {transcript.map((entry, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${entry.speaker === "assistant" ? "text-primary" : "text-foreground"}`}>
                          {entry.speaker === "assistant" ? "AI" : "You"}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDuration(entry.timestamp)}</span>
                      </div>
                      <p className="text-muted-foreground ml-4">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
                <div className="space-y-3">
                  <StatRow label="Total Questions Asked" value={transcript.filter((entry) => entry.speaker === "assistant").length} />
                  <StatRow label="Your Responses" value={transcript.filter((entry) => entry.speaker === "user").length} />
                  <StatRow label="Analysis Points Collected" value={behavioralMetrics.length} />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricBar = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <span className="font-bold">{Math.round(value)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className={`h-3 rounded-full ${value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const SpeakingPace = ({ value }: { value: number }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium">Speaking Pace</span>
      <span className="font-bold">{Math.round(value)} WPM</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className={`h-3 rounded-full ${value >= 120 && value <= 180 ? "bg-green-500" : "bg-yellow-500"}`}
        style={{ width: `${Math.min(100, (value / 220) * 100)}%` }}
      />
    </div>
    <p className="text-xs text-muted-foreground mt-1">Ideal: 120-180 WPM</p>
  </div>
);

const StatRow = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-bold">{value}</span>
  </div>
);

const ScoreTile = ({
  label,
  value,
  className,
}: {
  label: string;
  value: number | undefined;
  className?: string;
}) => (
  <div className={`p-3 border rounded-lg ${className || ""}`}>
    <p className="font-semibold">{label}</p>
    <p className="text-3xl font-bold">{value ?? 0}%</p>
  </div>
);

const ListBlock = ({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad" | "neutral";
}) => {
  const toneClass =
    tone === "good"
      ? "bg-green-50 border text-green-700"
      : tone === "bad"
        ? "bg-red-50 border text-red-700"
        : "bg-muted border";

  return (
    <div className={`p-4 rounded-lg ${toneClass}`}>
      <h3 className="font-bold mb-2">{title}</h3>
      {items.length > 0 ? (
        <ul className="list-disc ml-4">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No items available.</p>
      )}
    </div>
  );
};

export default InterviewFeedback;
