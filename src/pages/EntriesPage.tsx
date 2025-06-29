// src/pages/EntriesPage.tsx
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/api/api";
import axios from "axios";

interface SymptomFormData {
  date: Date;
  cramps: number;
  bloating: number;
  tender_breasts: number;
  headache: number;
  acne: number;
  mood: number;
  stress: number;
  energy: number;
  cervical_mucus: string;
  sleep_quality: number;
  libido: number;
  notes: string;
}

export default function SymptomLoggingPage() {
  const [formData, setFormData] = React.useState<SymptomFormData>({
    date: new Date(),
    cramps: 0,
    bloating: 0,
    tender_breasts: 0,
    headache: 0,
    acne: 0,
    mood: 3,
    stress: 0,
    energy: 3,
    cervical_mucus: "none",
    sleep_quality: 3,
    libido: 2,
    notes: "",
  });
  const [entryId, setEntryId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch existing entry for the selected date
  React.useEffect(() => {
    const fetchEntry = async () => {
      try {
        setFetching(true);
        const dateStr = formData.date.toISOString().split("T")[0];
        const { data } = await api.get(`/daily-entries/?date=${dateStr}`);
        if (data.results && data.results.length > 0) {
          const entry = data.results[0];
          setEntryId(entry.id);
          setFormData({
            date: new Date(entry.date),
            cramps: entry.cramps || 0,
            bloating: entry.bloating || 0,
            tender_breasts: entry.tender_breasts || 0,
            headache: entry.headache || 0,
            acne: entry.acne || 0,
            mood: entry.mood || 3,
            stress: entry.stress || 0,
            energy: entry.energy || 3,
            cervical_mucus: entry.cervical_mucus || "none",
            sleep_quality: entry.sleep_quality || 3,
            libido: entry.libido || 2,
            notes: entry.notes || "",
          });
        } else {
          setEntryId(null);
          setFormData((prev) => ({
            ...prev,
            cramps: 0,
            bloating: 0,
            tender_breasts: 0,
            headache: 0,
            acne: 0,
            mood: 3,
            stress: 0,
            energy: 3,
            cervical_mucus: "none",
            sleep_quality: 3,
            libido: 2,
            notes: "",
          }));
        }
        setFetching(false);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.error("Fetch Error:", err.response?.data || err);
        } else {
          console.error("Fetch Error:", err);
        }
        setError("Failed to load entry");
        setFetching(false);
      }
    };
    fetchEntry();
  }, [formData.date]);

  const handleChange = (field: keyof SymptomFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate: require at least one symptom or mucus observation
    const hasSymptoms = Object.entries(formData).some(
      ([key, value]) => {
        if (key === "date" || key === "notes" || key === "cervical_mucus") {
          return false;
        }
        // default values: mood/energy/sleep_quality default 3, libido default 2, others default 0
        if (
          (key === "mood" || key === "energy" || key === "sleep_quality") &&
          typeof value === "number" &&
          value !== 3
        ) {
          return true;
        }
        if (key === "libido" && typeof value === "number" && value !== 2) {
          return true;
        }
        if (
          typeof value === "number" &&
          key !== "mood" &&
          key !== "energy" &&
          key !== "sleep_quality" &&
          key !== "libido" &&
          value !== 0
        ) {
          return true;
        }
        return false;
      }
    ) || formData.cervical_mucus !== "none";

    if (!hasSymptoms) {
      toast.error("Please log at least one symptom or cervical mucus observation.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        date: formData.date.toISOString().split("T")[0],
        cramps: formData.cramps,
        bloating: formData.bloating,
        tender_breasts: formData.tender_breasts,
        headache: formData.headache,
        acne: formData.acne,
        mood: formData.mood,
        stress: formData.stress,
        energy: formData.energy,
        cervical_mucus: formData.cervical_mucus,
        sleep_quality: formData.sleep_quality,
        libido: formData.libido,
        notes: formData.notes,
      };
      console.log("POST/PATCH Payload:", payload);
      if (entryId) {
        const response = await api.patch(`/daily-entries/${entryId}/`, payload);
        console.log("Response:", response.data);
        toast.success("Symptoms updated successfully!");
      } else {
        const response = await api.post("/daily-entries/", payload);
        console.log("Response:", response.data);
        setEntryId(response.data.id);
        toast.success("Symptoms logged successfully!");
      }
      setLoading(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Submit Error:", err.response?.data || err);
        const detail =
          err.response?.data?.detail ??
          JSON.stringify(err.response?.data) ??
          "Unknown error";
        toast.error("Failed to save symptoms: " + detail);
      } else {
        console.error("Submit Error:", err);
        toast.error("Failed to save symptoms: Unknown error");
      }
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-col gap-6 p-4 lg:gap-8 lg:p-6">
          <h1 className="text-2xl font-bold">Log Your Symptoms</h1>
          {error && <div className="text-red-500">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Date Picker */}
            <Card>
              <CardHeader>
                <CardTitle>Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      data-empty={!formData.date}
                      className={cn(
                        "data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal",
                        fetching || loading ? "opacity-50 cursor-not-allowed" : ""
                      )}
                      disabled={fetching || loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && handleChange("date", date)}
                      disabled={(date) => date > new Date() || fetching || loading}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Physical Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle>Physical Symptoms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Cramps", field: "cramps" },
                  { label: "Bloating", field: "bloating" },
                  { label: "Tender Breasts", field: "tender_breasts" },
                  { label: "Headache", field: "headache" },
                  { label: "Acne", field: "acne" },
                ].map((item) => {
                  const field = item.field as keyof SymptomFormData;
                  const value = formData[field];
                  // value is number for these fields
                  return (
                    <div key={item.field} className="space-y-2">
                      <Label>{item.label} (0–5)</Label>
                      <Slider
                        value={[value as number]}
                        onValueChange={([v]) => handleChange(field, v)}
                        min={0}
                        max={5}
                        step={1}
                        disabled={fetching || loading}
                      />
                      <span className="text-sm text-muted-foreground">
                        {String(value)}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Emotional Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle>Emotional Symptoms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mood (0–5, higher is better)</Label>
                  <Slider
                    value={[formData.mood]}
                    onValueChange={([value]) => handleChange("mood", value)}
                    min={0}
                    max={5}
                    step={1}
                    disabled={fetching || loading}
                  />
                  <span className="text-sm text-muted-foreground">
                    {String(formData.mood)}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Stress (0–5)</Label>
                  <Slider
                    value={[formData.stress]}
                    onValueChange={([value]) => handleChange("stress", value)}
                    min={0}
                    max={5}
                    step={1}
                    disabled={fetching || loading}
                  />
                  <span className="text-sm text-muted-foreground">
                    {String(formData.stress)}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Energy (0–5)</Label>
                  <Slider
                    value={[formData.energy]}
                    onValueChange={([value]) => handleChange("energy", value)}
                    min={0}
                    max={5}
                    step={1}
                    disabled={fetching || loading}
                  />
                  <span className="text-sm text-muted-foreground">
                    {String(formData.energy)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Other Observations */}
            <Card>
              <CardHeader>
                <CardTitle>Other Observations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cervical Mucus</Label>
                  <Select
                    value={formData.cervical_mucus}
                    onValueChange={(value) => handleChange("cervical_mucus", value)}
                    disabled={fetching || loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mucus type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="sticky">Sticky</SelectItem>
                      <SelectItem value="watery">Watery</SelectItem>
                      <SelectItem value="egg-white">Egg-White</SelectItem>
                      <SelectItem value="creamy">Creamy</SelectItem>
                      <SelectItem value="atypical">Atypical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sleep Quality (0–5, higher is better)</Label>
                  <Slider
                    value={[formData.sleep_quality]}
                    onValueChange={([value]) => handleChange("sleep_quality", value)}
                    min={0}
                    max={5}
                    step={1}
                    disabled={fetching || loading}
                  />
                  <span className="text-sm text-muted-foreground">
                    {String(formData.sleep_quality)}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Libido (0–5)</Label>
                  <Slider
                    value={[formData.libido]}
                    onValueChange={([value]) => handleChange("libido", value)}
                    min={0}
                    max={5}
                    step={1}
                    disabled={fetching || loading}
                  />
                  <span className="text-sm text-muted-foreground">
                    {String(formData.libido)}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Any additional notes..."
                    rows={4}
                    disabled={fetching || loading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="col-span-1 lg:col-span-2 flex justify-end">
              <Button type="submit" disabled={fetching || loading}>
                {loading
                  ? "Saving..."
                  : entryId
                  ? "Update Symptoms"
                  : "Save Symptoms"}
              </Button>
            </div>
          </form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
