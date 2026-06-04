function RestaurantStatusSelect({
  value,
  onChange,
  disabled = false,
  disableBusy = false,
  id = "restaurant-status",
  "aria-label": ariaLabel = "Restaurant status",
  className = "",
}) {
  const normalized = (value || "open").toLowerCase();

  return (
    <label className={`rd-status-select-wrap ${className}`.trim()} htmlFor={id}>
      <span className={`rd-status-select-inner rd-status-select-inner-${normalized}`}>
        <select
          id={id}
          className="rd-status-select"
          value={normalized}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
        >
          <option value="open">Open</option>
          <option value="busy" disabled={disableBusy}>
            Busy
          </option>
          <option value="closed">Closed</option>
        </select>
        <span className="material-symbols-outlined rd-status-select-chevron" aria-hidden>
          expand_more
        </span>
      </span>
    </label>
  );
}

export default RestaurantStatusSelect;
