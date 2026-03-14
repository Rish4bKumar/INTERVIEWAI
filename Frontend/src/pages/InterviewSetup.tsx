import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Briefcase, Code, Palette, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import type { VoiceAccent, VoiceGender } from "@/hooks/useVoiceAssistant";

const jobFields = [
  {
    value: "software-engineer",
    label: "Software Engineer",
    icon: Code,
    description: "Technical coding interviews and system design",
  },
  {
    value: "product-manager",
    label: "Product Manager",
    icon: Briefcase,
    description: "Product strategy and roadmap discussions",
  },
  {
    value: "ux-designer",
    label: "UX Designer",
    icon: Palette,
    description: "Portfolio review and design thinking",
  },
  {
    value: "sales-executive",
    label: "Sales Executive",
    icon: TrendingUp,
    description: "Sales scenarios and negotiation skills",
  },
  {
    value: "hr-manager",
    label: "HR Manager",
    icon: Users,
    description: "People management and organizational skills",
  },
];

const InterviewSetup = () => {
  const [selectedField, setSelectedField] = useState("");
  const [voiceAccent, setVoiceAccent] = useState<VoiceAccent>("us");
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStartInterview = () => {
    if (!selectedField) {
      toast({
        title: "Select a job field",
        description: "Please choose a role before starting the interview",
        variant: "destructive",
      });
      return;
    }

    const selectedJobField = jobFields.find(f => f.value === selectedField);
    navigate(
      `/interview-session?field=${encodeURIComponent(selectedJobField?.label || selectedField)}&voiceAccent=${encodeURIComponent(voiceAccent)}&voiceGender=${encodeURIComponent(voiceGender)}`
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 space-y-4 animate-fade-in">
            <h1 className="text-5xl sm:text-6xl font-bold">
              Setup Your{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Interview
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose your target role and start practicing
            </p>
          </div>

          <div className="space-y-8 animate-scale-in">
            {/* Job Field Selection */}
            <Card className="p-8 bg-gradient-card border border-border">
              <h2 className="text-2xl font-bold mb-6">Select Your Job Field</h2>
              <div className="space-y-4">
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobFields.map((field) => (
                      <SelectItem
                        key={field.value}
                        value={field.value}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 py-2">
                          <field.icon className="w-5 h-5 text-primary" />
                          <span className="font-medium">{field.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Job Field Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {jobFields.map((field) => {
                    const Icon = field.icon;
                    const isSelected = selectedField === field.value;
                    return (
                      <div
                        key={field.value}
                        onClick={() => setSelectedField(field.value)}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="space-y-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isSelected
                                ? "bg-gradient-hero"
                                : "bg-muted"
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                isSelected ? "text-white" : "text-foreground"
                              }`}
                            />
                          </div>
                          <h3 className="font-bold">{field.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {field.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-card border border-border">
              <h2 className="text-2xl font-bold mb-6">AI Voice Preferences</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Accent</p>
                  <Select value={voiceAccent} onValueChange={(value) => setVoiceAccent(value as VoiceAccent)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select accent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">US Accent</SelectItem>
                      <SelectItem value="indian">Indian Accent</SelectItem>
                      <SelectItem value="uk">UK Accent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Voice Gender</p>
                  <Select value={voiceGender} onValueChange={(value) => setVoiceGender(value as VoiceGender)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Voice availability depends on your browser and operating system installed voices.
              </p>
            </Card>

            {/* Interview Details */}
            <Card className="p-8 bg-card border border-border">
              <h2 className="text-2xl font-bold mb-6">What to Expect</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Interview Features</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Real-time audio and video interaction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>AI-powered conversational flow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Instant speech-to-text transcription</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Performance tracking and analytics</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">You'll Be Evaluated On</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Eye contact and body language</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Speaking pace and clarity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Answer quality and relevance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Overall confidence and presence</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Start Button */}
            <div className="text-center">
              <Button
                size="lg"
                variant="hero"
                onClick={handleStartInterview}
                disabled={!selectedField}
                className="min-w-[250px]"
              >
                <Play className="w-5 h-5" />
                Start Interview Session
              </Button>
              {!selectedField && (
                <p className="text-sm text-muted-foreground mt-3">
                  Please select a job field to continue
                </p>
              )}
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

export default InterviewSetup;
