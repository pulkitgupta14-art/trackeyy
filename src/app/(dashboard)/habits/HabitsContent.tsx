"use client";

import * as React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Calendar, Clock, Target, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { HABIT_FREQUENCIES, HABIT_TYPES, UNITS, DEFAULT_CATEGORIES } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { Target as TargetIcon } from "lucide-react";
import { HabitCard, HabitCardSkeleton } from "@/components/habits/HabitCard";

interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  color: string;
  completed: boolean;
  time: string;
  type: string;
  frequency: string;
  target?: number;
  unit?: string;
  streak: number;
  reminderTime?: string;
}

const mockHabits: Habit[] = [
  { id: "1", name: "Morning Run", category: "Fitness", color: "#ef4444", completed: false, time: "06:00", type: "DURATION", frequency: "DAILY", target: 30, unit: "min", streak: 12 },
  { id: "2", name: "Study DSA", category: "Study", color: "#3b82f6", completed: false, time: "19:00", type: "DURATION", frequency: "WEEKDAYS", target: 90, unit: "min", streak: 5 },
  { id: "3", name: "Drink Water", category: "Health", color: "#10b981", completed: false, time: "", type: "QUANTITY", frequency: "DAILY", target: 3, unit: "L", streak: 28 },
  { id: "4", name: "Read 20 pages", category: "Learning", color: "#06b6d4", completed: false, time: "21:00", type: "QUANTITY", frequency: "DAILY", target: 20, unit: "pages", streak: 15 },
  { id: "5", name: "Meditation", category: "Health", color: "#f43f5e", completed: false, time: "22:00", type: "DURATION", frequency: "DAILY", target: 10, unit: "min", streak: 3 },
  { id: "6", name: "Code Review", category: "Work", color: "#8b5cf6", completed: false, time: "14:00", type: "DURATION", frequency: "WEEKDAYS", target: 60, unit: "min", streak: 8 },
];

export function HabitsContent() {
  const { addToast } = useUIStore();
  const [habits, setHabits] = React.useState<Habit[]>(mockHabits);
  const [showForm, setShowForm] = React.useState(false);
  const [editingHabit, setEditingHabit] = React.useState<Habit | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    categoryId: "",
    color: "#6366f1",
    type: "BOOLEAN",
    frequency: "DAILY",
    customDays: [] as number[],
    intervalDays: "",
    timesPerDay: "",
    targetValue: "",
    unit: "",
    startDate: "",
    endDate: "",
    reminderTime: "",
    reminderEnabled: false,
  });

  const categories = DEFAULT_CATEGORIES;

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = "Habit name is required";
    }
    if (!formData.categoryId) {
      errors.categoryId = "Please select a category";
    }
    if (formData.type !== "BOOLEAN" && formData.targetValue && parseFloat(formData.targetValue) <= 0) {
      errors.targetValue = "Target must be greater than 0";
    }
    if (formData.frequency === "CUSTOM_DAYS" && formData.customDays.length === 0) {
      errors.customDays = "Select at least one day";
    }
    if (formData.frequency === "INTERVAL" && (!formData.intervalDays || parseInt(formData.intervalDays) < 1)) {
      errors.intervalDays = "Interval must be at least 1 day";
    }
    if (formData.frequency === "MULTI_DAILY" && (!formData.timesPerDay || parseInt(formData.timesPerDay) < 1)) {
      errors.timesPerDay = "Times per day must be at least 1";
    }
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = "End date must be after start date";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newHabit: Habit = {
      id: editingHabit?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      category: formData.categoryId,
      color: formData.color,
      type: formData.type,
      frequency: formData.frequency,
      target: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
      unit: formData.unit,
      reminderTime: formData.reminderTime || undefined,
      completed: false,
      streak: editingHabit?.streak ?? 0,
      time: "",
    };

    if (editingHabit) {
      setHabits(habits.map(h => h.id === editingHabit.id ? { ...h, ...newHabit } : h));
      addToast({ type: "success", title: "Habit updated", description: newHabit.name });
    } else {
      setHabits([...habits, newHabit]);
      addToast({ type: "success", title: "Habit created", description: newHabit.name });
    }
    
    resetForm();
    setShowForm(false);
    setEditingHabit(null);
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      categoryId: "",
      color: "#6366f1",
      type: "BOOLEAN",
      frequency: "DAILY",
      customDays: [],
      intervalDays: "",
      timesPerDay: "",
      targetValue: "",
      unit: "",
      startDate: "",
      endDate: "",
      reminderTime: "",
      reminderEnabled: false,
    });
    setFormErrors({});
  };

  const editHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      description: habit.description || "",
      categoryId: habit.category,
      color: habit.color,
      type: habit.type,
      frequency: habit.frequency,
      customDays: habit.frequency === "CUSTOM_DAYS" ? [1, 3, 5] : [],
      intervalDays: "",
      timesPerDay: "",
      targetValue: habit.target?.toString() || "",
      unit: habit.unit || "",
      startDate: "",
      endDate: "",
      reminderTime: habit.reminderTime || "",
      reminderEnabled: !!habit.reminderTime,
    });
    setShowForm(true);
  };

  const deleteHabit = (id: string) => {
    if (confirm("Are you sure you want to delete this habit?")) {
      setHabits(habits.filter(h => h.id !== id));
      addToast({ type: "success", title: "Habit deleted" });
    }
  };

  const frequency = HABIT_FREQUENCIES.find(f => f.value === formData.frequency);
  const habitType = HABIT_TYPES.find(t => t.value === formData.type);

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Habits</h1>
          <p className="page-subtitle">Manage your habits and routines</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={<TargetIcon className="h-10 w-10" />}
          title="No habits yet"
          description="Create your first habit and start building your streak."
          action={
            <Button onClick={() => { resetForm(); setShowForm(true); }} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Habit
            </Button>
          }
        />
      ) : (
        <div className="grid-habits">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              {...habit}
              variant="list"
              onEdit={editHabit}
              onDelete={deleteHabit}
            />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="dialog-content-lg">
          <DialogHeader>
            <DialogTitle>{editingHabit ? "Edit Habit" : "Create Habit"}</DialogTitle>
            <DialogDescription>
              {editingHabit ? "Update your habit details" : "Create a new habit to track"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Run"
                  required
                  disabled={isSubmitting}
                  error={!!formErrors.name}
                  errorMessage={formErrors.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.categoryId && <p className="form-error">{formErrors.categoryId}</p>}
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
                  <span className="text-sm text-muted-foreground">
                    {formData.color}
                  </span>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => {
                      setFormData({ ...formData, type: v });
                      if (v !== "BOOLEAN" && !formData.unit) {
                        const defaultUnit = HABIT_TYPES.find(t => t.value === v)?.unit;
                        if (defaultUnit) setFormData(prev => ({ ...prev, unit: defaultUnit }));
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HABIT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label} {t.unit && `(${t.unit})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(v) => setFormData({ ...formData, frequency: v })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HABIT_FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          <div className="flex flex-col gap-0.5">
                            <span>{f.label}</span>
                            <span className="text-xs text-muted-foreground">{f.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {frequency?.value === "CUSTOM_DAYS" && (
                <div className="space-y-2">
                  <Label>Custom Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                      <label
                        key={day}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                          formData.customDays.includes(i)
                            ? "bg-primary/10 text-primary border-primary"
                            : "border-border hover:bg-accent"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={formData.customDays.includes(i)}
                          onChange={(e) => setFormData({
                            ...formData,
                            customDays: e.target.checked
                              ? [...formData.customDays, i]
                              : formData.customDays.filter(d => d !== i)
                          })}
                          className="sr-only"
                          disabled={isSubmitting}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                  {formErrors.customDays && <p className="form-error">{formErrors.customDays}</p>}
                </div>
              )}

              {frequency?.value === "INTERVAL" && (
                <div className="space-y-2">
                  <Label htmlFor="intervalDays">Every N days</Label>
                  <Input
                    id="intervalDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.intervalDays}
                    onChange={(e) => setFormData({ ...formData, intervalDays: e.target.value })}
                    placeholder="e.g., 2"
                    disabled={isSubmitting}
                    error={!!formErrors.intervalDays}
                    errorMessage={formErrors.intervalDays}
                  />
                </div>
              )}

              {frequency?.value === "MULTI_DAILY" && (
                <div className="space-y-2">
                  <Label htmlFor="timesPerDay">Times per day</Label>
                  <Input
                    id="timesPerDay"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.timesPerDay}
                    onChange={(e) => setFormData({ ...formData, timesPerDay: e.target.value })}
                    placeholder="e.g., 3"
                    disabled={isSubmitting}
                    error={!!formErrors.timesPerDay}
                    errorMessage={formErrors.timesPerDay}
                  />
                </div>
              )}

              {formData.type !== "BOOLEAN" && (
                <div className="form-grid-2">
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">Target Value *</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      step="any"
                      min="0.01"
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      placeholder="e.g., 30"
                      disabled={isSubmitting}
                      error={!!formErrors.targetValue}
                      errorMessage={formErrors.targetValue}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(v) => setFormData({ ...formData, unit: v })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="form-grid-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={isSubmitting}
                    error={!!formErrors.endDate}
                    errorMessage={formErrors.endDate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderTime">Reminder Time</Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center gap-2">
                <Input
                  id="reminderEnabled"
                  type="checkbox"
                  checked={formData.reminderEnabled}
                  onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="reminderEnabled">Enable reminder</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); setEditingHabit(null); }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  editingHabit ? "Update" : "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}