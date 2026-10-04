export function findCurrentSlot(slots, date = new Date()) {
  const weekday = date.getDay();
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return slots.find((slot) => slot.weekday === weekday && slot.startTime <= time && time < slot.endTime) ?? null;
}