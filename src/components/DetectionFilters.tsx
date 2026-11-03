import { Turbine } from "../types";

type Props = {
    turbines: Turbine[];
    turbineId:  string;
    onTurbineChange: (id: string) => void;
    unacknowledgedOnly: boolean;
    onUnacknowledgedChange: (checked: boolean) => void;
    
};

export function DetectionFilters({
    turbines,
    turbineId,
    onTurbineChange,
    unacknowledgedOnly,
    onUnacknowledgedChange,
}: Props) {
    return (
        <>
       <label className="field">
        <span className="field__label">Turbine</span>
        <select
          value={turbineId}
          onChange={(e) => onTurbineChange(e.target.value)}
        >
          <option value="">All turbines</option>

          {turbines.map((turbine) => (
            <option key={turbine.id} value={turbine.id}>
              {turbine.name}
            </option>
          ))}
        </select>
      </label>
      
        <label className="field field--inline">
        <input
          type="checkbox"
          checked={unacknowledgedOnly}
          onChange={(e) =>
            onUnacknowledgedChange(e.target.checked)
          }
        />
        <span>Unacknowledged only</span>
      </label>
    </>
  );
}