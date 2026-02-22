import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";

export function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    const newIsDark = document.documentElement.classList.contains("dark");
    setIsDark(newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  if (!user) return null;

  const isActive = (path: string) => location === path;

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    logoutMutation.mutate();
  };

  return (
    <>
      <nav className="border-b bg-background shadow-sm sticky top-0 z-50">
        <div className="w-full pl-2 pr-4 flex items-center justify-between">
          <div className="flex justify-between h-16 items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {/* Left: QuizHUB */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center gap-2 font-display text-primary" style={{ fontSize: '26px', fontWeight: 'bold' }}>
                <BookOpen className="w-7 h-7" />
                <span>QuizHUB</span>
              </Link>
            </div>

            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {user.role === "faculty" ? (
                <>
                  <Link href="/dashboard" className={`text-sm font-medium transition-colors ${isActive("/dashboard") ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary"}`}>
                    Dashboard
                  </Link>
                  <Link href="/create-quiz" className={`text-sm font-medium transition-colors ${isActive("/create-quiz") ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary"}`}>
                    Create Quiz
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className={`text-sm font-medium transition-colors ${isActive("/dashboard") ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary"}`}>
                    Dashboard
                  </Link>
                  <Link href="/history" className={`text-sm font-medium transition-colors ${isActive("/history") ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary"}`}>
                    My Attempts
                  </Link>
                </>
              )}
            </div>

            {/* Right: Dark Mode + User Info + Logout */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-muted-foreground hover:text-foreground"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <div className="text-sm text-right hidden sm:block">
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogoutClick}
                disabled={logoutMutation.isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
