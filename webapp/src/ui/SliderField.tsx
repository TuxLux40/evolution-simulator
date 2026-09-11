interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
  disabled?: boolean;
}

/** A range slider paired with a numeric input box, kept in sync. */
export function SliderField({ label, value, min, max, step, onChange, formatValue, disabled }: SliderFieldProps) {
  const display = formatValue ? formatValue(value) : String(value);

  return (
    <label className="field">
      <span>
        {label} ({display})
      </span>
      <div className="slider-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <input
          type="number"
          className="slider-number"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) onChange(v);
          }}
        />
      </div>
    </label>
  );
}
