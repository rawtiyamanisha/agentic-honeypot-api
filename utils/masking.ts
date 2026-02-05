
/**
 * Masks sensitive identifiers showing only the first and last few characters.
 * Adheres to the 2-4 character visibility rule for front/end characters to protect citizen privacy.
 * 
 * NOTE: This function is for display purposes only. The full value remains
 * intact in the application state for forensic logging and authority reporting.
 */
export const maskValue = (value: string, type: 'UPI' | 'PHONE' | 'BANK' | 'URL' | 'WALLET' | 'NAME' = 'UPI'): string => {
  if (!value) return '';
  
  const len = value.length;
  
  // Determine visibility count based on string length (2 to 4 characters)
  const getVisibleCount = (strLen: number) => {
    if (strLen >= 12) return 4;
    if (strLen >= 6) return 2;
    return 1;
  };

  switch (type) {
    case 'URL':
      // URLs are often kept for verification, but we'll mask long paths or sensitive query params
      try {
        const url = new URL(value);
        const path = url.pathname.length > 15 ? url.pathname.substring(0, 10) + '...' : url.pathname;
        return `${url.protocol}//${url.hostname}${path}`;
      } catch {
        return value.length > 30 ? value.substring(0, 20) + '...' : value;
      }

    case 'UPI':
      if (value.includes('@')) {
        const [handle, domain] = value.split('@');
        const visible = getVisibleCount(handle.length);
        const maskedHandle = handle.substring(0, visible) + '****' + handle.substring(handle.length - visible);
        return `${maskedHandle}@${domain}`;
      }
      break;

    case 'PHONE':
      // Preserve '+' for international format but mask the core digits
      const isInternational = value.startsWith('+');
      const numericPart = isInternational ? value.substring(1) : value;
      const pVisible = getVisibleCount(numericPart.length);
      const maskedPhone = numericPart.substring(0, pVisible) + '****' + numericPart.substring(numericPart.length - pVisible);
      return (isInternational ? '+' : '') + maskedPhone;

    case 'BANK':
    case 'WALLET':
      // Financial and Crypto addresses usually require 4 characters for verification
      const fVisible = getVisibleCount(len);
      return value.substring(0, fVisible) + '****' + value.substring(len - fVisible);

    case 'NAME':
      // Mask individual words in a name
      return value.split(' ').map(part => {
        if (part.length <= 2) return part[0] + '*';
        const nVisible = part.length > 5 ? 2 : 1;
        return part.substring(0, nVisible) + '***' + part.substring(part.length - nVisible);
      }).join(' ');
  }

  // Default fallback for any other string content
  const v = getVisibleCount(len);
  return value.substring(0, v) + '****' + value.substring(len - v);
};
