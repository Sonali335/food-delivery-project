import styles from "./Input.module.css";

function Input({ label, type, value, onChange, placeholder }) {
  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>{label}</label>
      <input
        type={type}
        className={styles.field}
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? ""}
      />
    </div>
  );
}

export default Input;
