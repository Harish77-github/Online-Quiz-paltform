import { useMyAttempts } from "@/hooks/use-attempts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function StudentHistory() {
  const { data: attempts, isLoading } = useMyAttempts();
  const [expandedAttempts, setExpandedAttempts] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedAttempts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary/30 py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight">Attempt History</h1>
          <p className="text-muted-foreground mt-2">Review your past performance, scores, and correct answers.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {attempts?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No attempts found. Take a quiz to see your history here!
          </div>
        ) : (
          attempts?.map((attempt: any) => {
            const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
            const isPass = percentage >= 60;
            const isExpanded = expandedAttempts[attempt.id] || false;
            const hasDetailedAnswers = Array.isArray(attempt.answers) && attempt.answers.length > 0 && typeof attempt.answers[0] === 'object';

            return (
              <Card key={attempt.id} className="overflow-hidden">
                <div className={`h-2 ${attempt.terminated ? 'bg-destructive' : isPass ? 'bg-green-500' : 'bg-amber-500'}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-xl mb-1">{attempt.quizTitle}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Completed on {(attempt.completedAt || attempt.submittedAt) ? format(new Date(attempt.completedAt || attempt.submittedAt), 'PPP p') : 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl font-bold ${isPass ? 'text-green-600' : 'text-amber-600'}`}>
                      {percentage}%
                    </span>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Correct Answers</span>
                          <span className="font-medium">{attempt.score}/{attempt.totalQuestions}</span>
                        </div>
                        <Progress value={percentage} className={`h-2 ${isPass ? 'text-green-500' : 'text-amber-500'}`} />
                      </div>
                      
                      {attempt.terminated && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-start gap-3 text-sm">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <div>
                            <p className="font-bold">Terminated</p>
                            <p>{attempt.terminationReason}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-secondary/30 rounded-lg p-4 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        {isPass ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-amber-500" />}
                        <span className="font-medium">{isPass ? "Passed" : "Failed"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {percentage < 50 ? "Needs Improvement" :
                         percentage < 75 ? "Passed! Needs Improvement" :
                         percentage < 90 ? "Great job! You're nailing it" :
                         "Great job! You've mastered this topic"}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Answer Review */}
                  {hasDetailedAnswers && (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(attempt.id)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full mt-4 gap-2 text-muted-foreground hover:text-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? "Hide Answer Details" : "View Answer Details"}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-4 space-y-3 border-t pt-4">
                          {attempt.answers.map((ans: any, idx: number) => (
                            <div 
                              key={idx} 
                              className={`p-4 rounded-lg border-l-4 ${
                                ans.isCorrect 
                                  ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20' 
                                  : 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-sm">
                                  <span className="text-muted-foreground">Q{idx + 1}:</span> {ans.questionText}
                                </p>
                                {ans.isCorrect ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shrink-0">Correct</Badge>
                                ) : (
                                  <Badge variant="destructive" className="shrink-0">Incorrect</Badge>
                                )}
                              </div>
                              <div className="mt-2 text-sm space-y-1">
                                <p>
                                  <span className="text-muted-foreground">Your answer:</span>{" "}
                                  <span className={ans.isCorrect ? "text-green-700 dark:text-green-400 font-medium" : "text-red-700 dark:text-red-400 font-medium"}>
                                    {ans.selectedAnswer || "Not answered"}
                                  </span>
                                </p>
                                {!ans.isCorrect && (
                                  <p>
                                    <span className="text-muted-foreground">Correct answer:</span>{" "}
                                    <span className="text-green-700 dark:text-green-400 font-medium">{ans.correctAnswer}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
