
export function formatDate(value, includeTime = false) {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? { hour: "2-digit", minute: "2-digit", hour12: true }
      : {}),
  }).format(date);
}

export function formatCurrency(value) {
  const amount = Number(value);

  if (value === "" || value == null || !Number.isFinite(amount)) {
    return "Not specified";
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}
