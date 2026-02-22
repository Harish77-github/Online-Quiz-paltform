import { useQuizzes } from "@/hooks/use-quizzes";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, User, Loader2, Ban, Lock, Timer, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

function useCountdown(targetDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft("");
      setIsExpired(false);
      return;
    }

    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft(`Expired on ${new Date(targetDate).toLocaleString("en-US", {
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit"
        })}`);
        return;
      }

      setIsExpired(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`Ends in ${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`);
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return { timeLeft, isExpired };
}

function QuizCard({ quiz }: { quiz: any }) {
  const { timeLeft, isExpired } = useCountdown(
    !quiz.isAlwaysAvailable ? quiz.availableUntil : null
  );
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (quiz.id) {
      apiRequest("GET", `/api/quizzes/${quiz.id}/lock-status`)
        .then(res => res.json())
        .then(data => setIsLocked(!!data.isLocked))
        .catch(() => {});
    }
  }, [quiz.id]);

  const isQuizExpired = !quiz.isAlwaysAvailable && isExpired;

  // Badge priority: Locked > Expired > New (24h) > Active
  const getBadge = () => {
    if (isLocked) {
      return <Badge variant="destructive" className="shrink-0">Locked</Badge>;
    }
    if (isQuizExpired) {
      return <Badge variant="destructive" className="shrink-0">Expired</Badge>;
    }
    const createdAt = quiz.createdAt ? new Date(quiz.createdAt).getTime() : 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (createdAt > oneDayAgo) {
      return <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20">New</Badge>;
    }
    return <Badge variant="secondary" className="shrink-0">Active</Badge>;
  };

  const isDisabled = isQuizExpired || isLocked;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 border-primary/10">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl line-clamp-2 leading-tight">{quiz.title}</CardTitle>
          {getBadge()}
        </div>
        <CardDescription className="line-clamp-2 mt-2">
          {quiz.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg mb-2">
          <User className="w-4 h-4 text-primary" />
          <span className="font-medium">Faculty:</span> {quiz.facultyName}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-medium">Availability:</span>{" "}
          {quiz.isAlwaysAvailable
            ? "Available anytime"
            : timeLeft || "Limited availability"}
        </div>
        {quiz.durationMinutes && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg mb-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="font-medium">Duration:</span> {quiz.durationMinutes} minutes
          </div>
        )}
        {quiz.hasAccessCode && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-medium">Access Code Required</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        {isDisabled ? (
          <div className="w-full space-y-2">
            <Button className="w-full h-12 text-base font-semibold" disabled variant="secondary">
              {isLocked ? <Lock className="w-5 h-5 mr-2" /> : <Ban className="w-5 h-5 mr-2" />}
              Attempt Quiz
            </Button>
            <p className="text-xs text-destructive text-center font-medium">
              {isLocked ? "Blocked due to violations" : timeLeft}
            </p>
          </div>
        ) : (
          <Link href={`/quiz/${quiz.id}`} className="w-full">
            <Button className="w-full h-12 text-base font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
              <PlayCircle className="w-5 h-5 mr-2" />
              Attempt Quiz
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

export default function StudentDashboard() {
  // Poll for new quizzes every 10 seconds
  const { data: quizzes, isLoading } = useQuizzes();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary/5 py-12 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">Find a quiz and start testing your knowledge.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Available Quizzes</h2>
          <Link href="/history">
            <Button variant="outline" className="hidden sm:flex">View Past Attempts</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : quizzes?.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-card">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No quizzes available</h3>
            <p className="text-muted-foreground mt-2">
              Check back later for new quizzes from your faculty.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes?.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
