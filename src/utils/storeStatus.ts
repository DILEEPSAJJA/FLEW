/**
 * Helper to determine if FLEW Gowlidoddy is currently open.
 * Hours: 1:00 PM (13:00) to 1:00 AM (01:00 next day) IST.
 */
export function getStoreStatus(): {
  isOpen: boolean;
  statusText: string;
  nextEventText: string;
  badgeColor: string;
} {
  // Current time in IST (UTC+5:30)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5);

  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;

  // Open from 13:00 (780 mins) to 24:00 (1440 mins) AND 00:00 (0 mins) to 01:00 (60 mins)
  const isOpen = currentTimeInMinutes >= 780 || currentTimeInMinutes < 60;

  if (isOpen) {
    if (currentTimeInMinutes < 60) {
      const minsLeft = 60 - currentTimeInMinutes;
      return {
        isOpen: true,
        statusText: 'Open Now (Closing Soon)',
        nextEventText: `Closes at 1:00 AM (${minsLeft}m left)`,
        badgeColor: 'bg-emerald-500'
      };
    } else {
      return {
        isOpen: true,
        statusText: 'Open Now',
        nextEventText: 'Serving till 1:00 AM',
        badgeColor: 'bg-emerald-500'
      };
    }
  } else {
    const minsUntilOpen = 780 - currentTimeInMinutes;
    const hoursUntilOpen = Math.floor(minsUntilOpen / 60);
    return {
      isOpen: false,
      statusText: 'Opens at 1:00 PM',
      nextEventText: `Opens in ${hoursUntilOpen > 0 ? `${hoursUntilOpen}h ` : ''}${minsUntilOpen % 60}m`,
      badgeColor: 'bg-amber-500'
    };
  }
}
