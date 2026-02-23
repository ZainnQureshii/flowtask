import { describe, it, expect } from 'vitest';
import { formatDuration, formatTimer, formatDate, formatDateFull, formatTime, formatRelative, isOverdue, cn } from '../../lib/utils';

describe('formatDuration', () => {
  it('should format seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });
  it('should format minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });
  it('should format hours and minutes', () => {
    expect(formatDuration(3661)).toBe('1h 1m');
  });
  it('should format zero seconds', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});

describe('formatTimer', () => {
  it('should format as MM:SS', () => {
    expect(formatTimer(65)).toBe('01:05');
    expect(formatTimer(0)).toBe('00:00');
    expect(formatTimer(3600)).toBe('60:00');
  });
  it('should pad single-digit seconds', () => {
    expect(formatTimer(5)).toBe('00:05');
  });
});

describe('formatDate', () => {
  it('should return empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('should return "Today" for today', () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T12:00:00`;
    expect(formatDate(today)).toBe('Today');
  });

  it('should return "Tomorrow" for tomorrow', () => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const tomorrow = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}T12:00:00`;
    expect(formatDate(tomorrow)).toBe('Tomorrow');
  });

  it('should format other dates as "MMM d"', () => {
    expect(formatDate('2025-06-15')).toMatch(/Jun 15/);
  });
});

describe('formatDateFull', () => {
  it('should format date with year', () => {
    expect(formatDateFull('2025-03-15T00:00:00Z')).toMatch(/Mar 15, 2025/);
  });
});

describe('formatTime', () => {
  it('should format time as "h:mm a"', () => {
    const result = formatTime('2025-01-01T14:30:00Z');
    // Result depends on local timezone, just check it matches pattern
    expect(result).toMatch(/\d{1,2}:\d{2}\s[AP]M/);
  });
});

describe('formatRelative', () => {
  it('should return a relative time string', () => {
    const recent = new Date(Date.now() - 60000).toISOString();
    const result = formatRelative(recent);
    expect(result).toMatch(/ago/);
  });
});

describe('isOverdue', () => {
  it('should return false for null', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('should return false for today', () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T12:00:00`;
    expect(isOverdue(today)).toBe(false);
  });

  it('should return true for past date', () => {
    expect(isOverdue('2020-01-01')).toBe(true);
  });

  it('should return false for future date', () => {
    expect(isOverdue('2030-12-31')).toBe(false);
  });
});

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end');
  });

  it('should merge tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
