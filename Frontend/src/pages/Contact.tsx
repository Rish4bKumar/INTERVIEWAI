import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Contact = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you as soon as possible.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4 animate-fade-in">
            <h1 className="text-5xl sm:text-6xl font-bold">
              Get in{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 animate-scale-in">
            {/* Contact Form */}
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input id="name" placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="your@email.com" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input id="subject" placeholder="How can we help?" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    required
                  />
                </div>
                <Button type="submit" size="lg" variant="hero" className="w-full">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-gradient-card rounded-2xl p-8 shadow-lg border border-border">
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-muted-foreground">support@interviewai.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Live Chat</h3>
                      <p className="text-muted-foreground">
                        Available Monday - Friday, 9am - 5pm EST
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Office</h3>
                      <p className="text-muted-foreground">
                        123 Innovation Drive
                        <br />
                        San Francisco, CA 94103
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
                <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">How does the AI interview work?</h4>
                    <p className="text-muted-foreground">
                      Our AI uses advanced speech recognition and natural language processing
                      to conduct realistic interviews.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Is my data secure?</h4>
                    <p className="text-muted-foreground">
                      Yes, we use enterprise-grade encryption and follow strict privacy
                      standards.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Can I practice multiple times?</h4>
                    <p className="text-muted-foreground">
                      Absolutely! Practice as many times as you need to feel confident.
                    </p>
                  </div>
                </div>
              </div>
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

export default Contact;
