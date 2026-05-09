import styles from "./Button.module.css";

function Button({ text, onClick, disabled }) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
}

export default Button;
