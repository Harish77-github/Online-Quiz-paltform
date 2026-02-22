import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuizSchema } from "@shared/schema";
import { z } from "zod";
import { useCreateQuiz } from "@/hooks/use-quizzes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, ArrowLeft, GripVertical, CheckCircle2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";

// Extend schema to validate questions array properly
const createQuizFormSchema = insertQuizSchema.extend({
  questions: z.array(z.object({
    questionText: z.string().min(1, "Question text is required"),
    options: z.array(z.string().min(1, "Option text required")).min(2, "At least 2 options required"),
    correctAnswerIndex: z.number().min(0),
  })).min(1, "At least one question is required"),
}).omit({ facultyId: true });

type FormValues = z.infer<typeof createQuizFormSchema>;

export default function CreateQuiz() {
  const [, setLocation] = useLocation();
  const createQuiz = useCreateQuiz();
  const [isAlwaysAvailable, setIsAlwaysAvailable] = useState(true);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(createQuizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [
        { 
          questionText: "", 
          options: ["", "", "", ""], 
          correctAnswerIndex: 0 
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const onSubmit = (data: FormValues) => {
    createQuiz.mutate({
      ...data,
      isAlwaysAvailable,
      availableFrom: isAlwaysAvailable ? null : (availableFrom || null),
      availableUntil: isAlwaysAvailable ? null : (availableUntil || null),
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      accessCode: accessCode.trim() || null,
    } as any, {
      onSuccess: () => {
        toast.success("Quiz published successfully!");
        setLocation("/dashboard");
      }
    });
  };

  const handlePublishClick = () => {
    // Validate form first, then show confirmation
    form.handleSubmit(() => {
      setShowConfirmDialog(true);
    })();
  };

  const confirmPublish = () => {
    setShowConfirmDialog(false);
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <div className="bg-background border-b sticky top-0 z-10 shadow-sm">
        <div className="w-full pl-2 pr-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg">Create New Quiz</h1>
          </div>
        </div>
      </div>

      {/* Fixed Position Publish Button */}
      <Button 
        onClick={handlePublishClick} 
        disabled={createQuiz.isPending}
        className="fixed top-20 right-8 z-[1000] shadow-lg shadow-primary/20"
        style={{ position: 'fixed', top: '80px', right: '30px', zIndex: 1000 }}
      >
        {createQuiz.isPending ? "Saving..." : "Publish Quiz"}
        <Save className="w-4 h-4 ml-2" />
      </Button>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        <Form {...form}>
          <form className="space-y-8">
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
                <CardTitle>Quiz Details</CardTitle>
                <CardDescription>Basic information about your quiz</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Introduction to React Patterns" className="text-lg font-medium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Briefly describe what this quiz covers..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Availability Settings */}
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
                <CardTitle>Availability Settings</CardTitle>
                <CardDescription>Control when students can access this quiz</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Always Available</p>
                    <p className="text-sm text-muted-foreground">Students can take this quiz at any time</p>
                  </div>
                  <Switch
                    checked={isAlwaysAvailable}
                    onCheckedChange={(checked) => setIsAlwaysAvailable(checked)}
                  />
                </div>
                {!isAlwaysAvailable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Available From</label>
                      <Input
                        type="datetime-local"
                        value={availableFrom}
                        onChange={(e) => setAvailableFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Available Until</label>
                      <Input
                        type="datetime-local"
                        value={availableUntil}
                        onChange={(e) => setAvailableUntil(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Duration & Access Code Settings */}
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
                <CardTitle>Quiz Settings</CardTitle>
                <CardDescription>Duration and access control options</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="No time limit"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for no time limit</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Access Code (optional)</label>
                    <Input
                      type="text"
                      placeholder="e.g. QUIZ2026"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Students must enter this code to start</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Questions ({fields.length})</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ 
                  questionText: "", 
                  options: ["", "", "", ""], 
                  correctAnswerIndex: 0 
                })}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </Button>
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} ref={(el) => { questionRefs.current[index] = el; }}>
                <Card className="overflow-hidden border-l-4 border-l-primary/50 relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50 group-hover:bg-primary transition-colors" />
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-secondary text-secondary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-4">
                        <FormField
                          control={form.control}
                          name={`questions.${index}.questionText`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder="Type your question here..." 
                                  className="resize-none font-medium text-base min-h-[80px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-3">
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            Answer Options (Select correct one)
                          </FormLabel>
                          
                          <FormField
                            control={form.control}
                            name={`questions.${index}.correctAnswerIndex`}
                            render={({ field }) => (
                              <RadioGroup
                                value={field.value.toString()}
                                onValueChange={(val) => field.onChange(parseInt(val))}
                                className="space-y-3"
                              >
                                {[0, 1, 2, 3].map((optionIndex) => (
                                  <div key={optionIndex} className="flex items-center gap-3">
                                    <RadioGroupItem 
                                      value={optionIndex.toString()} 
                                      id={`q${index}-opt${optionIndex}`}
                                      className="data-[state=checked]:border-primary data-[state=checked]:text-primary"
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`questions.${index}.options.${optionIndex}`}
                                      render={({ field: optionField }) => (
                                        <div className={`flex-1 relative rounded-md transition-colors ${
                                          form.watch(`questions.${index}.correctAnswerIndex`) === optionIndex 
                                            ? "ring-2 ring-primary/20 bg-primary/5" 
                                            : ""
                                        }`}>
                                          <Input 
                                            {...optionField} 
                                            placeholder={`Option ${optionIndex + 1}`}
                                            className="bg-transparent border-transparent hover:border-input focus:border-input" 
                                          />
                                          {form.watch(`questions.${index}.correctAnswerIndex`) === optionIndex && (
                                            <CheckCircle2 className="w-4 h-4 text-primary absolute right-3 top-1/2 -translate-y-1/2" />
                                          )}
                                        </div>
                                      )}
                                    />
                                  </div>
                                ))}
                              </RadioGroup>
                            )}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {/* Inline Add Question Below */}
                <div className="flex justify-center mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-primary gap-1"
                    onClick={() => {
                      const insertAt = index + 1;
                      append({ 
                        questionText: "", 
                        options: ["", "", "", ""], 
                        correctAnswerIndex: 0 
                      });
                      // Move the newly appended item to the correct position via form
                      setTimeout(() => {
                        questionRefs.current[insertAt]?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 150);
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    Add Question Below
                  </Button>
                </div>
                </div>
              ))}
            </div>

            {fields.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-xl bg-background/50">
                <p className="text-muted-foreground mb-4">You haven't added any questions yet.</p>
                <Button
                  type="button"
                  onClick={() => append({ 
                    questionText: "", 
                    options: ["", "", "", ""], 
                    correctAnswerIndex: 0 
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Question
                </Button>
              </div>
            )}

            <div ref={bottomRef} />
          </form>
        </Form>
      </div>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to publish this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the quiz available to students. Please review all questions before publishing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish} disabled={createQuiz.isPending}>
              {createQuiz.isPending ? "Publishing..." : "Yes, Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
