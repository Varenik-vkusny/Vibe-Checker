import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { X, SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export interface SearchSettings {
    acoustics: number;
    lighting: number;
    crowdedness: number;
    budget: number;
    restrictions: string[];
}

interface SearchSettingsPanelProps {
    settings: SearchSettings;
    onSettingsChange: (settings: SearchSettings) => void;
    className?: string;
}

export function SearchSettingsPanel({ settings, onSettingsChange, className }: SearchSettingsPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [restrictionInput, setRestrictionInput] = useState("");

    const handleSliderChange = (key: keyof SearchSettings) => (value: number[]) => {
        onSettingsChange({
            ...settings,
            [key]: value[0]
        });
    };

    const addRestriction = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && restrictionInput.trim()) {
            e.preventDefault();
            if (!settings.restrictions.includes(restrictionInput.trim())) {
                onSettingsChange({
                    ...settings,
                    restrictions: [...settings.restrictions, restrictionInput.trim()]
                });
            }
            setRestrictionInput("");
        }
    };

    const removeRestriction = (tag: string) => {
        onSettingsChange({
            ...settings,
            restrictions: settings.restrictions.filter(r => r !== tag)
        });
    };

    return (
        <Card className={cn("p-4 space-y-6 w-full max-w-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm tracking-tight">SEARCH SETTINGS</h4>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setIsOpen(!isOpen)}>
                    {/* Using a visual toggle logic could go here if we wanted to collapse it */}
                </Button>
            </div>

            <div className="space-y-6">
                {/* Acoustics */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
                        <span>Quiet</span>
                        <span>{settings.acoustics}%</span>
                        <span>Loud</span>
                    </div>
                    <Slider
                        value={[settings.acoustics]}
                        onValueChange={handleSliderChange('acoustics')}
                        max={100}
                        step={1}
                        className="[&_.relative]:bg-zinc-200 dark:[&_.relative]:bg-zinc-800"
                    />
                </div>

                {/* Lighting */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
                        <span>Dim</span>
                        <span>{settings.lighting}%</span>
                        <span>Bright</span>
                    </div>
                    <Slider
                        value={[settings.lighting]}
                        onValueChange={handleSliderChange('lighting')}
                        max={100}
                        step={1}
                    />
                </div>

                {/* Crowdedness */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
                        <span>Empty</span>
                        <span>{settings.crowdedness}%</span>
                        <span>Crowded</span>
                    </div>
                    <Slider
                        value={[settings.crowdedness]}
                        onValueChange={handleSliderChange('crowdedness')}
                        max={100}
                        step={1}
                    />
                </div>

                {/* Budget */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
                        <span>Economy</span>
                        <span>{settings.budget}%</span>
                        <span>Premium</span>
                    </div>
                    <Slider
                        value={[settings.budget]}
                        onValueChange={handleSliderChange('budget')}
                        max={100}
                        step={1}
                    />
                </div>

                {/* Restrictions */}
                <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Restrictions (Exclude)</Label>
                    <Input
                        placeholder="Type 'Hookah' + Enter..."
                        value={restrictionInput}
                        onChange={(e) => setRestrictionInput(e.target.value)}
                        onKeyDown={addRestriction}
                        className="h-9"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {settings.restrictions.length === 0 && (
                            <span className="text-xs text-muted-foreground/50 italic">No restrictions active.</span>
                        )}
                        {settings.restrictions.map(tag => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
                                {tag}
                                <X
                                    className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                                    onClick={() => removeRestriction(tag)}
                                />
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}
