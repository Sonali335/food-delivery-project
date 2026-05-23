const ROLES = [
  { value: "customer", label: "Customer", icon: "person" },
  { value: "driver", label: "Driver", icon: "delivery_dining" },
  { value: "restaurant", label: "Restaurant", icon: "storefront" },
];

function RoleSelector({ value, onChange }) {
  return (
    <fieldset className="auth-role-group">
      <legend className="auth-role-legend">I am a</legend>
      <div className="auth-role-grid">
        {ROLES.map((role) => (
          <label key={role.value} className="auth-role-option">
            <input
              className="auth-role-input"
              type="radio"
              name="role"
              value={role.value}
              checked={value === role.value}
              onChange={() => onChange(role.value)}
            />
            <span className="auth-role-card">
              <span className="material-symbols-outlined auth-role-icon" aria-hidden>
                {role.icon}
              </span>
              <span className="auth-role-label">{role.label}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default RoleSelector;
