import styles from "./Button.module.css";

function Button({ text, onClick, disabled, variant = "primary" }) {
  const className =
    variant === "secondary"
      ? `${styles.button} ${styles.secondary}`
      : styles.button;

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
}

export default Button;
