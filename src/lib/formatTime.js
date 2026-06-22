export const formatTime = (time24) => {
  if (!time24) return '';
  // Handle formats like "13:50" or "13:50:00"
  const [hourStr, minuteStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${minuteStr} ${ampm}`;
};
