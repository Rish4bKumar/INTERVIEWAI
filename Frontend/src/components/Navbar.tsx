import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mic, Menu, X, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useClerk } from "@clerk/clerk-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Profile SVG Icon Component
const ProfileIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const clerk = useClerk();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              InterviewAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 justify-center flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive(link.path)
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 text-sm font-medium">
                  <ProfileIcon className="w-4 h-4" />
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Avatar className="w-10 h-10 cursor-pointer">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                      <AvatarFallback>
                        {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                        <AvatarFallback>
                          {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {user?.fullName || "User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user?.primaryEmailAddress?.emailAddress}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => clerk.openUserProfile()} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Manage account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => clerk.signOut()} 
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* Auth Buttons - Mobile */}
            <div className="pt-2 border-t border-border mt-2">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 text-sm font-medium">
                    <ProfileIcon className="w-4 h-4" />
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted mb-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="flex items-center justify-center py-2">
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                      },
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
