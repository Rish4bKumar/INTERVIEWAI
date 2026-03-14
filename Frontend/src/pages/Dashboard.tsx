import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, BarChart3, CalendarClock, Award, ArrowRight } from "lucide-react";
import { getInterviewHistoryForUser } from "@/utils/interviewHistory";
import { getResumeHistoryForUser } from "@/utils/resumeHistory";

const formatDuration = (ms: number) => {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

export default function Dashboard() {
  const { user } = useUser();

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.emailAddresses?.[0]?.emailAddress) return user.emailAddresses[0].emailAddress[0].toUpperCase();
    return "U";
  };

  const interviewHistory = useMemo(() => {
    if (!user?.id) return [];
    return getInterviewHistoryForUser(user.id);
  }, [user?.id]);

  const resumeHistory = useMemo(() => {
    if (!user?.id) return [];
    return getResumeHistoryForUser(user.id);
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="w-20 h-20 border-2 border-primary">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Welcome, {user?.firstName || "User"}!
              </h1>
              <p className="text-muted-foreground mt-1">
                {user?.primaryEmailAddress?.emailAddress || "Track your interview progress and keep improving"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link to="/dashboard#resume-history" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Resume History</CardTitle>
                      <CardDescription>View previous analyses and ATS scores</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track resume improvements and review detailed analysis from past submissions.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/interview-setup" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Start New Interview</CardTitle>
                      <CardDescription>Practice with AI and get full feedback</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Complete a new session to collect richer feedback, verdicts, and measurable progress.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Interview History</CardTitle>
              <CardDescription>
                Review previous interviews with verdicts, scores, and full transcripts to learn and improve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interviewHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <p className="text-muted-foreground">No interview records yet. Complete your first interview to build history.</p>
                  <Link to="/interview-setup" className="inline-flex mt-4">
                    <span className="text-primary font-medium hover:underline">Start Interview</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviewHistory.map((record) => (
                    <div key={record.id} className="rounded-xl border border-border p-4 bg-card/80">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">{record.interviewData.jobField}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="w-4 h-4" />
                              {new Date(record.createdAt).toLocaleString()}
                            </span>
                            <span>Duration: {formatDuration(record.interviewData.duration)}</span>
                            <span>Responses: {record.interviewData.transcript.filter((entry) => entry.speaker === "user").length}</span>
                          </div>
                          <p className="text-sm text-foreground/90">
                            Verdict:{" "}
                            <span className="font-medium">
                              {record.aiFeedback?.final_verdict || "Feedback pending"}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Overall Score</p>
                            <p className="text-2xl font-bold text-primary inline-flex items-center gap-1">
                              <Award className="w-5 h-5" />
                              {record.aiFeedback?.overall_score ?? 0}%
                            </p>
                          </div>
                          <Link to={`/interview-feedback?historyId=${encodeURIComponent(record.id)}`}>
                            <Button variant="outline">
                              View Full Feedback
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="resume-history" className="border-2 border-primary/20 mt-8">
            <CardHeader>
              <CardTitle className="text-2xl">Resume History</CardTitle>
              <CardDescription>
                Revisit previous resume analyses and track ATS improvements over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resumeHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <p className="text-muted-foreground">No resume analysis records yet. Upload a resume to start tracking.</p>
                  <Link to="/resume-analyzer" className="inline-flex mt-4">
                    <span className="text-primary font-medium hover:underline">Analyze Resume</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {resumeHistory.map((record) => (
                    <div key={record.id} className="rounded-xl border border-border p-4 bg-card/80">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">{record.fileName}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="w-4 h-4" />
                              {new Date(record.createdAt).toLocaleString()}
                            </span>
                            <span>Role: {record.results?.profession || "Unknown"}</span>
                            <span>Missing Skills: {record.results?.missing_skills?.length ?? 0}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">ATS Score</p>
                            <p className="text-2xl font-bold text-primary inline-flex items-center gap-1">
                              <Award className="w-5 h-5" />
                              {record.results?.profession_ats_score ?? 0}%
                            </p>
                          </div>
                          <Link to={`/resume-results?historyId=${encodeURIComponent(record.id)}`}>
                            <Button variant="outline">
                              View Report
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
