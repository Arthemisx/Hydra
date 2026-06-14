"use client";

const URINE_COLORS = [
  { value: 1, color: "#F5F5DC", label: "1" },
  { value: 2, color: "#FFFACD", label: "2" },
  { value: 3, color: "#FFE4B5", label: "3" },
  { value: 4, color: "#FFD700", label: "4" },
  { value: 5, color: "#DAA520", label: "5" },
  { value: 6, color: "#CD853F", label: "6" },
  { value: 7, color: "#B8860B", label: "7" },
  { value: 8, color: "#8B6914", label: "8" },
];

interface UrineColorPickerProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function UrineColorPicker({ value, onChange }: UrineColorPickerProps) {
  return (
    <div>
      <div className="urine-picker">
        {URINE_COLORS.map((c) => (
          <div key={c.value} style={{ textAlign: "center" }}>
            <div
              className={`urine-tube ${value === c.value ? "selected" : ""}`}
              style={{ backgroundColor: c.color }}
              onClick={() => onChange(c.value)}
              title={`Nivel ${c.value}`}
            />
            <div className="urine-tube-label">{c.label}</div>
          </div>
        ))}
      </div>
      {value && (
        <p className="helper" style={{ marginTop: "0.5rem" }}>
          Nivel selecionado: <strong>{value}</strong>
          {value <= 3 ? " (Bem hidratado)" : value <= 5 ? " (Atencao)" : " (Desidratado)"}
        </p>
      )}
    </div>
  );
}
