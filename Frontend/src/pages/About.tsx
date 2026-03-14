import Navbar from "@/components/Navbar";
import { Users, Target, Award, Zap } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16 space-y-4 animate-fade-in">
            <h1 className="text-5xl sm:text-6xl font-bold">
              About{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                InterviewAI
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Empowering job seekers with cutting-edge AI technology
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8 animate-scale-in">
            <div className="bg-gradient-card rounded-2xl p-8 shadow-lg border border-border">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                At InterviewAI, we believe that everyone deserves the opportunity to shine
                in their job interviews. We've created an advanced AI-powered platform that
                simulates real interview scenarios, providing you with the practice and
                feedback you need to succeed.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: Target,
                  title: "Our Vision",
                  description:
                    "To revolutionize interview preparation through artificial intelligence and make professional coaching accessible to everyone.",
                },
                {
                  icon: Users,
                  title: "Our Team",
                  description:
                    "A passionate group of AI experts, career coaches, and developers dedicated to your success.",
                },
                {
                  icon: Award,
                  title: "Our Values",
                  description:
                    "Excellence, innovation, and inclusivity drive everything we do in helping you achieve your career goals.",
                },
                {
                  icon: Zap,
                  title: "Our Technology",
                  description:
                    "State-of-the-art AI models analyze your performance in real-time, providing insights that actually help you improve.",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-card rounded-2xl p-8 shadow-lg border border-border">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Why Choose Us?</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-foreground">Real-time Analysis:</strong> Get
                    instant feedback during your practice sessions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-foreground">Comprehensive Metrics:</strong>{" "}
                    Track eye contact, speaking speed, clarity, and more
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-foreground">Personalized Coaching:</strong>{" "}
                    Receive tailored recommendations based on your performance
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-foreground">Secure & Private:</strong> Your
                    data is encrypted and handled with the highest security standards
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 InterviewAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
