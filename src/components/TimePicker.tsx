/**
 * TimePicker Component
 * Responsive time picker that adapts to screen size
 * - Mobile/Tablet/iPad (< 1024px): iOS-style scroll picker
 * - Desktop (>= 1024px): Standard keyboard input
 *
 * Breakpoint includes all iPad sizes:
 * - iPad Mini: 768px x 1024px
 * - iPad Air/Pro 11": 834px x 1194px
 * - iPad Pro 12.9": 1024px x 1366px
 *
 * Both variants use 12-hour format for display
 * and convert to 24-hour format for data storage
 */
"use client";

import { useState, useEffect } from "react";
import { TimePickerMobile } from "./TimePickerMobile";
import { TimePickerDesktopSimple } from "./TimePickerDesktopSimple";

interface TimePickerProps {
  /** Current time value in 24-hour HH:MM format */
  value: string;
  /** Callback when value changes (returns 24-hour HH:MM format) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Optional label */
  label?: string;
}

/**
 * Custom hook to detect screen size
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "--:-- --",
  label,
}: TimePickerProps) {
  // Detect if screen is mobile/tablet/iPad (< 1024px)
  // This catches all iPads in both portrait and landscape
  const isMobileOrTablet = useMediaQuery("(max-width: 1023px)");

  return (
    <div className="space-y-2">
      {/* Optional label */}
      {label && <label className="block text-sm font-medium">{label}</label>}

      {/* Render appropriate picker based on screen size */}
      {isMobileOrTablet ? (
        <TimePickerMobile
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <TimePickerDesktopSimple
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
