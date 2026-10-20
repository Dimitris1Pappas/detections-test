type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBox({ value, onChange }: Props) {
  return (
    <label className="field field--grow">
      <span className="field__label">Search</span>
      <input
        type="search"
        value={value}
        placeholder="Species or turbine, e.g. kite or T03"
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
