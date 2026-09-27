"use client";

import * as React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell, Footprints, Bike, Trophy, BookOpen, Code, Book, Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { StatCard } from "@/components/ui/stat-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const mockActivities = [
  { id: "1", type: "RUNNING", duration: 30, distance: 5, date: "2024-01-15T06:00:00Z", notes: "Felt great!" },
  { id: "2", type: "GYM", duration: 60, date: "2024-01-14T18:00:00Z", notes: "Upper body" },
  { id: "3", type: "CYCLING", duration: 45, distance: 20, date: "2024-01-13T10:00:00Z", notes: "" },
  { id: "4", type: "STUDYING", duration: 90, date: "2024-01-12T19:00:00Z", notes: "DSA practice" },
  { id: "5", type: "MEDITATION", duration: 15, date: "2024-01-11T22:00:00Z", notes: "Calm session" },
];

const activityIcons = {
  GYM: Dumbbell,
  RUNNING: Footprints,
  WALKING: Footprints,
  CYCLING: Bike,
  BADMINTON: Trophy,
  STUDYING: BookOpen,
  CODING: Code,
  READING: Book,
  MEDITATION: Brain,
  CUSTOM: Plus,
};

const stats = [
  { label: "Total Activities", value: mockActivities.length, icon: Dumbbell, iconColor: "text-primary", iconBg: "bg-primary/10" },
  { label: "Total Time", value: `${mockActivities.reduce((sum, a) => sum + a.duration, 0)} min`, icon: Brain, iconColor: "text-success", iconBg: "bg-success/10" },
  { label: "Total Distance", value: `${mockActivities.filter(a => a.distance).reduce((sum, a) => sum + (a.distance || 0), 0)} km`, icon: Footprints, iconColor: "text-warning", iconBg: "bg-warning/10" },
  { label: "This Week", value: mockActivities.filter(a => new Date(a.date) > new Date(Date.now() - 7 * 86400000)).length, icon: Trophy, iconColor: "text-purple-500", iconBg: "bg-purple-500/10" },
];

export function ActivitiesContent() {
  const { addToast } = useUIStore();
  const [activities, setActivities] = React.useState(mockActivities);
  const [showForm, setShowForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState({
    type: "RUNNING",
    duration: "",
    distance: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"),
    notes: "",
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      errors.duration = "Duration must be greater than 0";
    }
    if (formData.distance && parseFloat(formData.distance) < 0) {
      errors.distance = "Distance cannot be negative";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newActivity = {
      id: Date.now().toString(),
      type: formData.type,
      duration: parseInt(formData.duration),
      distance: formData.distance ? parseFloat(formData.distance) : undefined,
      date: `${formData.date}T${formData.time}:00`,
      notes: formData.notes,
    };
    
    setActivities([newActivity, ...activities]);
    addToast({ type: "success", title: "Activity logged", description: ACTIVITY_TYPES.find(t => t.value === formData.type)?.label });
    
    resetForm();
    setShowForm(false);
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      type: "RUNNING",
      duration: "",
      distance: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      notes: "",
    });
    setFormErrors({});
  };

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activities</h1>
          <p className="page-subtitle">Track your workouts and activities</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </div>

      <div className="grid-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={Icon}
              iconColor={stat.iconColor}
              iconBg={stat.iconBg}
            />
          );
        })}
      </div>

      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activities</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {activities.length === 0 ? (
            <div className="py-12 text-center">
              <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No activities logged</h3>
              <p className="text-muted-foreground mb-4">Start tracking your workouts and activities</p>
              <Button onClick={() => { resetForm(); setShowForm(true); }} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => {
                const typeInfo = ACTIVITY_TYPES.find(t => t.value === activity.type);
                const Icon = activityIcons[activity.type as keyof typeof activityIcons] || Plus;
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: (typeInfo?.color || "#6366f1") + "20" }}
                    >
                      <Icon className="h-6 w-6" style={{ color: typeInfo?.color || "#6366f1" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{typeInfo?.label || activity.type}</h3>
                        <Badge variant="muted" className="text-xs">{format(new Date(activity.date), "MMM d, yyyy")}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Icon className="h-3 w-3" style={{ color: typeInfo?.color }} />
                          {activity.duration} min
                        </span>
                        {activity.distance && (
                          <span className="flex items-center gap-1">
                            <Footprints className="h-3 w-3" />
                            {activity.distance} km
                          </span>
                        )}
                      </div>
                      {activity.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{activity.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>Record your workout or activity</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Activity Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="form-grid-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 30"
                    required
                    disabled={isSubmitting}
                    error={!!formErrors.duration}
                    errorMessage={formErrors.duration}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    placeholder="e.g., 5.5"
                    disabled={isSubmitting}
                    error={!!formErrors.distance}
                    errorMessage={formErrors.distance}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about your activity"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Logging...
                  </>
                ) : (
                  "Log Activity"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}