import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Remove undefined values from an object recursively
 * Firestore doesn't allow undefined values, so this ensures data is clean before saving
 * Preserves null values, arrays, dates, and other valid Firestore types
 */
export function removeUndefined<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const cleaned = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      // Skip undefined values
      continue;
    }
    
    // Handle nested objects (but not arrays, dates, or null)
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      const cleanedValue = removeUndefined(value);
      // Only include if the cleaned object has at least one property
      if (Object.keys(cleanedValue).length > 0) {
        cleaned[key as keyof T] = cleanedValue;
      }
    } else {
      // Include all other values (null, arrays, dates, primitives)
      cleaned[key as keyof T] = value;
    }
  }
  return cleaned;
}