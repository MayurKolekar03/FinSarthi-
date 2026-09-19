/**
 * INR Currency & Date formatting utilities
 */

/**
 * Format numbers using Indian numbering system (e.g. ₹1,25,450.00 or ₹1,25,450)
 */
export const formatINR = (amount: number, showDecimals: boolean = false): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
};

/**
 * Short representation for large numbers (e.g. ₹2.4L, ₹1.5Cr)
 */
export const formatCompactINR = (amount: number): string => {
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? '-₹' : '₹';

  if (abs >= 10000000) {
    return `${prefix}${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${prefix}${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${prefix}${(abs / 1000).toFixed(1)}k`;
  }
  return formatINR(amount, false);
};

/**
 * Friendly Indian localized date formatter
 */
export const formatFriendlyDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `Today, ${hours}:${minutes}`;
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-IN', options);
  } catch {
    return dateString;
  }
};
