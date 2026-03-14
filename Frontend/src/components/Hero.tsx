import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-illustration.png";
import { useUser, useClerk } from "@clerk/clerk-react";

const Hero = () => {
  const { isSignedIn } = useUser();
  const clerk = useClerk();

  // Open Clerk sign-up modal / redirect
  const handleGetStarted = () => {
    // Prefer opening Clerk's sign up modal if available; falls back to opening sign-in.
    try {
      clerk.openSignUp?.();
    } catch (e) {
      // If openSignUp isn't available for some reason, fallback to signIn route
      window.location.href = "/sign-in";
    }
  };

  const handleSignIn = () => {
    try {
      clerk.openSignIn?.();
    } catch (e) {
      window.location.href = "/sign-in";
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="noise-overlay"></div>
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-primary/20 shadow-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                AI-Powered Interview Practice
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Master Your
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Interview Skills
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Practice with AI-driven interviews, get real-time feedback on your
              performance, and land your dream job with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              {isSignedIn ? (
                <>
                  <Link to="/interview-setup">
                    <Button size="lg" variant="hero" className="group shadow-lg hover:shadow-xl">
                      Start Interview
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/resume-analyzer">
                    <Button size="lg" variant="outline" className="bg-background/75 backdrop-blur-sm">
                      Analyze Resume
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button onClick={handleGetStarted} size="lg" variant="hero" className="group shadow-lg hover:shadow-xl">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  {/* small sign-in helper so users who already have an account can sign in */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Already have an account?</span>
                    <button
                      onClick={handleSignIn}
                      className="rounded-full px-3 py-1.5 bg-muted hover:bg-primary/10 text-primary transition-colors"
                    >
                      Sign in
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-xl">
              {[
                { label: "Mock Sessions", value: "10k+" },
                { label: "Role Tracks", value: "25+" },
                { label: "Avg. Rating", value: "4.9" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Illustration */}
          <div className="relative animate-scale-in">
            <div className="absolute inset-0 bg-gradient-hero opacity-20 blur-3xl rounded-full animate-pulse-glow"></div>
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-6 -left-5 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur-sm animate-float">
              <p className="text-xs font-semibold text-foreground">Real-time AI Feedback</p>
            </div>
            <div className="absolute bottom-10 -right-4 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur-sm animate-float" style={{ animationDelay: "1.5s" }}>
              <p className="text-xs font-semibold text-foreground">Voice + Video Practice</p>
            </div>
            <img
              src={heroImage}
              alt="AI Interview Illustration"
              className="relative w-full h-auto rounded-3xl border border-border/50 shadow-2xl glow-primary-hover transform transition-transform duration-300 hover:scale-[1.03]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
