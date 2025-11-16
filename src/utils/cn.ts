export function cn(
  ...args: Array<string | false | null | undefined | Record<string, boolean>>
) {
  return args
    .flatMap((arg) => {
      if (!arg) {
        return [];
      }
      if (typeof arg === "string") {
        return [arg];
      }
      return Object.entries(arg)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key);
    })
    .join(" ")
    .trim();
}
