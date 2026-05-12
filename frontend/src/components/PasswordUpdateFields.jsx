import Input from "./Input";
import styles from "./PasswordUpdateFields.module.css";

function PasswordUpdateFields({
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
}) {
  return (
    <div className={styles.block}>
      <p className={styles.legend}>Change password (optional)</p>
      <Input
        label="Current password"
        type="password"
        value={currentPassword}
        onChange={(e) => onCurrentPasswordChange(e.target.value)}
        placeholder="Required if you already have a password"
      />
      <Input
        label="New password"
        type="password"
        value={newPassword}
        onChange={(e) => onNewPasswordChange(e.target.value)}
        placeholder="At least 6 characters"
      />
      <Input
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        placeholder="Re-enter new password"
      />
    </div>
  );
}

export default PasswordUpdateFields;
