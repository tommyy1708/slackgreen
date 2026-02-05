function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function getMinutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function isWorkDay(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

function isWithinWorkHours(date, workHours) {
  const currentMinutes = getMinutesSinceMidnight(date);
  const startMinutes = parseTime(workHours.start);
  const endMinutes = parseTime(workHours.end);
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function getCurrentStatus(date, config) {
  const currentMinutes = getMinutesSinceMidnight(date);

  for (const override of config.statusOverrides) {
    const startMinutes = parseTime(override.start);
    const endMinutes = parseTime(override.end);
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return { emoji: override.emoji, text: override.text };
    }
  }

  return {
    emoji: config.defaultStatus.emoji,
    text: config.defaultStatus.text
  };
}

function shouldBeActive(date, config) {
  return isWorkDay(date) && isWithinWorkHours(date, config.workHours);
}

module.exports = {
  parseTime,
  isWorkDay,
  isWithinWorkHours,
  getCurrentStatus,
  shouldBeActive
};
