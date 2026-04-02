import { useState } from "react";
import { PresetSidebar } from "../common/preset-sidebar";

const BeamLayout = ({ children }: { children: React.ReactNode }) => {
    const [selectedPreset, setSelectedPreset] = useState<{ id: string } | null>(null);

    const handlePresetSelect = (preset: { id: string }) => {
        setSelectedPreset(preset);
    };
    return (
        <div className="flex w-full  h-full justify-between overflow-y-hidden gap-0 md:gap-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900">
            {children}
            <PresetSidebar onSelectPreset={handlePresetSelect} selectedPresetId={selectedPreset?.id} />

        </div>
    )
}
export default BeamLayout;  