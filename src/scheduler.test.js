const {
  isWorkDay,
  isWithinWorkHours,
  getCurrentStatus,
  parseTime
} = require('./scheduler');

describe('scheduler', () => {
  describe('parseTime', () => {
    test('parses HH:MM to minutes since midnight', () => {
      expect(parseTime('09:00')).toBe(540);
      expect(parseTime('18:00')).toBe(1080);
      expect(parseTime('11:30')).toBe(690);
    });
  });

  describe('isWorkDay', () => {
    test('returns true for Monday-Friday', () => {
      expect(isWorkDay(new Date('2025-02-03T12:00:00'))).toBe(true); // Monday
      expect(isWorkDay(new Date('2025-02-07T12:00:00'))).toBe(true); // Friday
    });

    test('returns false for Saturday-Sunday', () => {
      expect(isWorkDay(new Date('2025-02-08T12:00:00'))).toBe(false); // Saturday
      expect(isWorkDay(new Date('2025-02-09T12:00:00'))).toBe(false); // Sunday
    });
  });

  describe('isWithinWorkHours', () => {
    const workHours = { start: '09:00', end: '18:00' };

    test('returns true during work hours', () => {
      const date = new Date('2025-02-03T10:00:00');
      expect(isWithinWorkHours(date, workHours)).toBe(true);
    });

    test('returns false before work hours', () => {
      const date = new Date('2025-02-03T08:00:00');
      expect(isWithinWorkHours(date, workHours)).toBe(false);
    });

    test('returns false after work hours', () => {
      const date = new Date('2025-02-03T19:00:00');
      expect(isWithinWorkHours(date, workHours)).toBe(false);
    });
  });

  describe('getCurrentStatus', () => {
    const config = {
      defaultStatus: { emoji: ':green_circle:', text: 'Available' },
      statusOverrides: [
        { start: '11:30', end: '12:30', emoji: ':bento:', text: 'Lunch' },
        { start: '14:00', end: '15:00', emoji: ':headphones:', text: 'Focus' }
      ]
    };

    test('returns default status outside override windows', () => {
      const date = new Date('2025-02-03T10:00:00');
      expect(getCurrentStatus(date, config)).toEqual({
        emoji: ':green_circle:',
        text: 'Available'
      });
    });

    test('returns override status during override window', () => {
      const date = new Date('2025-02-03T12:00:00');
      expect(getCurrentStatus(date, config)).toEqual({
        emoji: ':bento:',
        text: 'Lunch'
      });
    });

    test('returns second override during its window', () => {
      const date = new Date('2025-02-03T14:30:00');
      expect(getCurrentStatus(date, config)).toEqual({
        emoji: ':headphones:',
        text: 'Focus'
      });
    });
  });
});
