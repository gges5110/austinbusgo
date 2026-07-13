export type LightPreset = "dawn" | "day" | "dusk" | "night";

/**
 * Lighting preset for the Mapbox Standard style. Dark theme always gets
 * night; light theme follows the local time of day (never night, so a
 * deliberate light-theme choice isn't overridden after sunset).
 */
export const getLightPreset = (
  darkMode: boolean,
  date: Date = new Date()
): LightPreset => {
  if (darkMode) return "night";
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 18) return "day";
  return "dusk";
};
