import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image?: string;
}

const FeatureCard = ({ icon: Icon, title, description, image }: FeatureCardProps) => {
  return (
    <Card className="group p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-border/70 hover:border-primary/30 bg-card/85 backdrop-blur-md relative overflow-hidden">
      <div className="absolute inset-0 opacity-90 bg-gradient-card"></div>
      <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-colors duration-500"></div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="shimmer absolute inset-0"></div>
      </div>
      
      <div className="space-y-4 relative z-10">
        {image ? (
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 glow-primary-hover">
            <Icon className="w-8 h-8 text-white" />
          </div>
        )}
        
        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{title}</h3>
        <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">{description}</p>
      </div>
    </Card>
  );
};

export default FeatureCard;
