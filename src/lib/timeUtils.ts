/**
 * Time Utility Functions
 * Handles conversion between 12-hour and 24-hour time formats
 */

export interface Time12Hour {
  hours: number // 1-12
  minutes: number // 0-59
  period: 'AM' | 'PM'
}

/**
 * Convert 24-hour time string to 12-hour format
 * @param time24 - Time in HH:MM format (e.g., "14:30")
 * @returns Time in 12-hour format (e.g., "2:30 PM")
 */
export function convert24to12(time24: string): string {
  if (!time24 || time24 === '') return ''

  const [hoursStr, minutesStr] = time24.split(':')
  const hours24 = parseInt(hoursStr ?? '0', 10)
  const minutes = parseInt(minutesStr ?? '0', 10)

  const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM'
  let hours12 = hours24 % 12
  if (hours12 === 0) hours12 = 12

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Convert 12-hour time to 24-hour format
 * @param hours - Hours in 12-hour format (1-12)
 * @param minutes - Minutes (0-59)
 * @param period - AM or PM
 * @returns Time in HH:MM format (e.g., "14:30")
 */
export function convert12to24(hours: number, minutes: number, period: 'AM' | 'PM'): string {
  let hours24 = hours

  if (period === 'AM') {
    if (hours === 12) hours24 = 0
  } else {
    if (hours !== 12) hours24 = hours + 12
  }

  return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Parse a time string in various formats to 12-hour components
 * @param timeStr - Time string (e.g., "2:30 PM", "14:30", "230pm")
 * @returns Time12Hour object or null if invalid
 */
export function parseTimeString(timeStr: string): Time12Hour | null {
  if (!timeStr) return null

  // Remove all spaces
  const cleaned = timeStr.replace(/\s/g, '').toUpperCase()

  // Check for 12-hour format with AM/PM
  const match12 = cleaned.match(/^(\d{1,2}):?(\d{2})(AM|PM)$/)
  if (match12) {
    const hours = parseInt(match12[1] ?? '0', 10)
    const minutes = parseInt(match12[2] ?? '0', 10)
    const period = match12[3] as 'AM' | 'PM'

    if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes, period }
    }
  }

  // Check for 24-hour format
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/)
  if (match24) {
    const hours24 = parseInt(match24[1] ?? '0', 10)
    const minutes = parseInt(match24[2] ?? '0', 10)

    if (hours24 >= 0 && hours24 <= 23 && minutes >= 0 && minutes <= 59) {
      const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM'
      let hours12 = hours24 % 12
      if (hours12 === 0) hours12 = 12

      return { hours: hours12, minutes, period }
    }
  }

  return null
}

/**
 * Format time components to 12-hour string
 * @param hours - Hours (1-12)
 * @param minutes - Minutes (0-59)
 * @param period - AM or PM
 * @returns Formatted time string (e.g., "9:30 AM")
 */
export function formatTime12(hours: number, minutes: number, period: 'AM' | 'PM'): string {
  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Get current time in 12-hour format
 * @returns Current time as Time12Hour object
 */
export function getCurrentTime12(): Time12Hour {
  const now = new Date()
  const hours24 = now.getHours()
  const minutes = now.getMinutes()
  const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM'
  let hours12 = hours24 % 12
  if (hours12 === 0) hours12 = 12

  return { hours: hours12, minutes, period }
}
