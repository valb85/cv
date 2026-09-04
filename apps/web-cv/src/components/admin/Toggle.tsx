export const Toggle = ({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) => (
  <label className="toggle">
    <input type="checkbox" name={name} defaultChecked={defaultChecked} />
    <span className="track" aria-hidden="true" />
    <span>
      <span className="toggle-label">{label}</span>
      <span className="toggle-hint">{hint}</span>
    </span>
  </label>
);
