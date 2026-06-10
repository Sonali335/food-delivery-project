import { formatEtaLabel } from "../utils/formatEta";

function OrderEtaText({ eta, className = "" }) {
  const label = formatEtaLabel(eta);
  if (!label) return null;
  return (
    <p className={`order-eta-text ${className}`.trim()}>
      ETA: {label}
    </p>
  );
}

export default OrderEtaText;
