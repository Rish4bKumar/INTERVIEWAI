import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Brain, FileCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClerk, useUser } from "@clerk/clerk-react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureCard from "@/components/FeatureCard";
import { ScrollAnimate } from "@/components/ScrollAnimate";
import resumeIcon from "@/assets/resume-icon.png";
import interviewIcon from "@/assets/interview-icon.png";

const Index = () => {
  const { isSignedIn } = useUser();
  const clerk = useClerk();

  const handleMockInterviewClick = () => {
    if (isSignedIn) {
      return;
    }

    try {
      clerk.openSignIn?.();
    } catch {
      window.location.href = "/sign-in";
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl"></div>
      <div className="pointer-events-none absolute top-[36rem] -left-20 h-80 w-80 rounded-full bg-accent/15 blur-3xl"></div>

      <Navbar />
      <Hero />

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto">
          <ScrollAnimate animation="zoom-out">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Everything You Need to{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  Ace Your Interview
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our AI-powered platform provides comprehensive tools to help you prepare,
                practice, and perform at your best.
              </p>
            </div>
          </ScrollAnimate>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ScrollAnimate animation="zoom-out" delay={0}>
              <FeatureCard
                icon={FileCheck}
                image={resumeIcon}
                title="Resume Analysis"
                description="Get detailed feedback on your resume with AI-powered insights and optimization suggestions."
              />
            </ScrollAnimate>
            <ScrollAnimate animation="zoom-out" delay={100}>
              <FeatureCard
                icon={Video}
                image={interviewIcon}
                title="Live Interview"
                description="Practice with realistic AI interviews featuring real-time audio and video interactions."
              />
            </ScrollAnimate>
            <ScrollAnimate animation="zoom-out" delay={200}>
              <FeatureCard
                icon={BarChart3}
                title="Performance Metrics"
                description="Track your speaking speed, eye contact, clarity, and get comprehensive performance scores."
              />
            </ScrollAnimate>
            <ScrollAnimate animation="zoom-out" delay={300}>
              <FeatureCard
                icon={Brain}
                title="Smart Feedback"
                description="Receive personalized recommendations to improve your interview skills based on AI analysis."
              />
            </ScrollAnimate>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto">
          <ScrollAnimate animation="zoom-out">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                How It <span className="bg-gradient-hero bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get started in three simple steps
              </p>
            </div>
          </ScrollAnimate>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Choose Your Role",
                description: "Select the job position you're preparing for from our extensive list.",
              },
              {
                step: "02",
                title: "Start Interview",
                description: "Engage with our AI interviewer through real-time audio and video.",
              },
              {
                step: "03",
                title: "Get Feedback",
                description: "Receive detailed analysis and actionable insights to improve.",
              },
            ].map((item, index) => (
              <ScrollAnimate key={index} animation="slide-up" delay={index * 150}>
                <div className="relative text-center space-y-4 group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center text-3xl font-bold text-white mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <ScrollAnimate animation="fade-in-up">
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-hero p-8 sm:p-12 text-center text-white shadow-2xl">
              <div className="noise-overlay"></div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight relative z-10">
                Ready to Practice Smarter?
              </h2>
              <p className="mt-4 text-white/85 max-w-2xl mx-auto relative z-10">
                Start with a mock interview, get instant insights, and sharpen your confidence before the real interview.
              </p>
              {isSignedIn ? (
                <Link to="/interview-setup" className="relative z-10 inline-flex mt-8">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                    Try a Mock Interview
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <div className="relative z-10 mt-8">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90"
                    onClick={handleMockInterviewClick}
                  >
                    Sign In to Try Mock Interview
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <p className="mt-3 text-sm text-white/85">
                    Create a free account to access personalized interview sessions.
                  </p>
                </div>
              )}
            </div>
          </ScrollAnimate>
        </div>
      </section>

      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <h3 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">InterviewAI</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-based interview preparation platform with mock interviews, resume analysis, and personalized coaching insights.
              </p>
              <p className="text-sm font-medium text-foreground">Support: support@interviewai.com</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground">Product</h4>
              <Link to="/resume-analyzer" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Resume Analyzer</Link>
              <Link to="/interview-setup" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Mock Interview</Link>
              <Link to="/dashboard" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Dashboard</Link>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground">Company</h4>
              <Link to="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link>
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
              <Link to="/sign-up" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Create Account</Link>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground">Why Users Choose Us</h4>
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Real-time feedback on clarity, pace, and confidence.</p>
                <p className="text-sm text-muted-foreground">Targeted preparation for role-specific questions.</p>
                <p className="text-sm text-muted-foreground">Actionable post-session insights to improve faster.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">&copy; 2026 InterviewAI. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Built for job seekers with practical AI coaching.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
