import { useCountUp } from "../../lib/useCountUp";

// Matches the first number in a string (regular hyphen or unicode minus),
// e.g. "78%" -> ["", "78", "%"], "3m 48s" -> ["", "3", "m 48s"].
const NUMBER_PATTERN = /^([^\d−-]*)([−-]?\d+(?:\.\d+)?)(.*)$/;

// Animates the numeric portion of a value like "78%" or "3m 48s" from 0 up
// to its real value once `start` is true, leaving any surrounding text
// (units, signs) static. Falls back to the plain string if no number is
// found. useCountUp is always called (with a 0 fallback target) so this
// never skips a hook call across renders, per the Rules of Hooks.
export function AnimatedValue({ value, start }: { value: string; start: boolean }) {
  const match = value.match(NUMBER_PATTERN);
  const numberStr = match?.[2] ?? "0";
  const target = parseFloat(numberStr.replace("−", "-"));
  const decimals = numberStr.includes(".") ? numberStr.split(".")[1].length : 0;
  const animated = useCountUp(target, start);

  if (!match) return <>{value}</>;

  const [, prefix, , suffix] = match;
  const rounded = decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toString();
  const display = rounded.replace("-", "−");

  return (
    <>
      {prefix}
      {display}
      {suffix}
    </>
  );
}
