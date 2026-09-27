"use client";

import * as React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Trash2, Edit, Loader2, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  color: string;
  deadline: string;
  linkedHabits: string[];
}

const mockGoals: Goal[] = [
  { id: "1", name: "Run 50km this month", target: 50, current: 32.5, unit: "km", color: "#ef4444", deadline: "2024-01-31", linkedHabits: ["Morning Run"] },
  { id: "2", name: "Study 100 hours", target: 100, current: 42, unit: "hrs", color: "#3b82f6", deadline: "2024-03-31", linkedHabits: ["Study DSA"] },
  { id: "3", name: "Gym 20 sessions", target: 20, current: 16, unit: "sessions", color: "#8b5cf6", deadline: "2024-02-28", linkedHabits: ["Gym Session"] },
];

const units = ["km", "miles", "hours", "minutes", "sessions", "pages", "reps", "kg", "lbs"];

export function GoalsContent() {
  const { addToast } = useUIStore();
  const [goals, setGoals] = React.useState<Goal[]>(mockGoals);
  const [showForm, setShowForm] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState({
    name: "",
    target: "",
    unit: "km",
    color: "#6366f1",
    deadline: "",
    linkedHabits: [] as string[],
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = "Goal name is required";
    }
    if (!formData.target || parseFloat(formData.target) <= 0) {
      errors.target = "Target must be greater than 0";
    }
    if (!formData.deadline) {
      errors.deadline = "Deadline is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newGoal: Goal = {
      id: editingGoal?.id || Date.now().toString(),
      name: formData.name,
      target: parseFloat(formData.target),
      current: 0,
      unit: formData.unit,
      color: formData.color,
      deadline: formData.deadline,
      linkedHabits: formData.linkedHabits,
    };

    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? { ...g, ...newGoal } : g));
      addToast({ type: "success", title: "Goal updated", description: newGoal.name });
    } else {
      setGoals([...goals, newGoal]);
      addToast({ type: "success", title: "Goal created", description: newGoal.name });
    }

    resetForm();
    setShowForm(false);
    setEditingGoal(null);
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      target: "",
      unit: "km",
      color: "#6366f1",
      deadline: "",
      linkedHabits: [],
    });
    setFormErrors({});
  };

  const editGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target: goal.target.toString(),
      unit: goal.unit,
      color: goal.color,
      deadline: goal.deadline,
      linkedHabits: goal.linkedHabits,
    });
    setShowForm(true);
  };

  const deleteGoal = (id: string) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      setGoals(goals.filter(g => g.id !== id));
      addToast({ type: "success", title: "Goal deleted" });
    }
  };

  const getDaysLeft = (deadline: string) => {
    return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "text-success";
    if (progress >= 75) return "text-primary";
    if (progress >= 50) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle">Track your long-term targets</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">Create a goal to track your long-term progress</p>
            <Button onClick={() => { resetForm(); setShowForm(true); }} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = goal.target > 0 ? Math.min(Math.round((goal.current / goal.target) * 100), 100) : 0;
            const daysLeft = getDaysLeft(goal.deadline);
            const progressColor = getProgressColor(progress);
            const isOverdue = daysLeft === 0 && progress < 100;

            return (
              <Card key={goal.id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: goal.color + "20" }}
                      >
                        <Target className="h-6 w-6" style={{ color: goal.color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{goal.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>{goal.current}/{goal.target} {goal.unit}</span>
                          <span className={cn("font-medium", progressColor)}>
                            {progress}% complete
                          </span>
                          <span className={cn(isOverdue ? "text-destructive" : "text-muted-foreground")}>
                            {isOverdue ? "Overdue" : `${daysLeft} days left`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => editGoal(goal)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={progress} className="h-2.5" style={{ backgroundColor: goal.color }} />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>Deadline: {format(new Date(goal.deadline), "MMM d, yyyy")}</span>
                      <span className={cn("font-medium", progressColor)}>
                        {progress}%
                      </span>
                    </div>
                  </div>
                  {goal.linkedHabits.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Flag className="h-3 w-3" />
                      <span>Linked: {goal.linkedHabits.join(", ")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "Create Goal"}</DialogTitle>
            <DialogDescription>
              {editingGoal ? "Update your goal details" : "Set a new target to work towards"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Run 50km this month"
                  required
                  disabled={isSubmitting}
                  error={!!formErrors.name}
                  errorMessage={formErrors.name}
                />
              </div>

              <div className="form-grid-2">
                <div className="space-y-2">
                  <Label htmlFor="target">Target Value *</Label>
                  <Input
                    id="target"
                    type="number"
                    step="any"
                    min="0.01"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    placeholder="e.g., 50"
                    required
                    disabled={isSubmitting}
                    error={!!formErrors.target}
                    errorMessage={formErrors.target}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    disabled={isSubmitting}
                    className="h-10 w-14 p-0 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{formData.color}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                  disabled={isSubmitting}
                  error={!!formErrors.deadline}
                  errorMessage={formErrors.deadline}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); setEditingGoal(null); }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  editingGoal ? "Update" : "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}