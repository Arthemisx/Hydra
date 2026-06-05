"use client";

import { apiJson } from "@/lib/api";

const PRESETS = [
  { icon: "💧", label: "Squeeze", volume: 150, source: "squeeze_bottle" },
  { icon: "🥤", label: "Copo", volume: 200, source: "cup" },
  { icon: "🧴", label: "Garrafa", volume: 500, source: "bottle" },
];

interface FluidButtonsProps {
  sessionId: number;
  totalMl: number;
  onAdded: () => void;
}

export default function FluidButtons({ sessionId, totalMl, onAdded }: FluidButtonsProps) {
  const addFluid = async (volume: number, source: string) => {
    await apiJson(`/sessions/${sessionId}/fluid`, {
      method: "POST",
      body: JSON.stringify({ volume_ml: volume, source }),
    });
    onAdded();
  };

  return (
    <div>
      <div className="fluid-buttons">
        {PRESETS.map((p) => (
          <button
            key={p.source}
            className="fluid-btn"
            onClick={() => addFluid(p.volume, p.source)}
            type="button"
          >
            <span className="fluid-icon">{p.icon}</span>
            <span className="fluid-label">{p.label}</span>
            <span className="fluid-volume">{p.volume} mL</span>
          </button>
        ))}
      </div>
      <div className="fluid-total">
        <div className="total-label">Total ingerido</div>
        <div className="total-value">{totalMl} mL</div>
      </div>
    </div>
  );
}
