import { useQuizzes } from "@/hooks/use-quizzes";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function FacultyDashboard() {
  const { data: quizzes, isLoading } = useQuizzes();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary/5 py-12 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Faculty Dashboard</h1>
              <p className="text-muted-foreground mt-2 text-lg">Manage your quizzes and track student performance.</p>
            </div>
            <Link href="/create-quiz">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] transition-all">
                <Plus className="w-5 h-5" />
                Create New Quiz
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Your Quizzes</h2>
          <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            {quizzes?.length || 0} Total
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : quizzes?.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-card">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No quizzes created yet</h3>
            <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
              Get started by creating your first quiz for your students.
            </p>
            <Link href="/create-quiz">
              <Button variant="outline">Create Quiz</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes?.map((quiz) => (
              <Card key={quiz.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                    {quiz.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px]">
                    {quiz.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{quiz.createdAt ? format(new Date(quiz.createdAt), 'MMM d, yyyy') : 'Recently'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Link href={`/quiz/${quiz.id}/attempts`} className="w-full">
                    <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Users className="w-4 h-4 mr-2" />
                      View Results
                      <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
