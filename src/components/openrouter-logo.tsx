import { cn } from "@/lib/utils";

const BRAND_FILLS = {
  /** Inherits the surrounding text color */
  current: "fill-current",
  /** Brand purple, for light backgrounds */
  light: "fill-[#7624F4]",
  /** Brand lime, for dark backgrounds */
  dark: "fill-[#C8FF00]",
} as const;

export type OpenRouterLogoMode = keyof typeof BRAND_FILLS;

export function OpenRouterLogo({
  className,
  mode = "current",
}: {
  className?: string;
  /** "current" inherits text color; "light"/"dark" use the brand colors for that background */
  mode?: OpenRouterLogoMode;
}) {
  return (
    <svg
      viewBox="0 0 401.4 293.7"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", BRAND_FILLS[mode], className)}
    >
      <path d="M303.9475,17.19926c42.79734,0,77.48933,34.69327,77.48933,77.48933s-34.69199,77.48933-77.48933,77.48933l76.86166,76.86244c9.76367,9.76313,2.84903,26.45667-10.95697,26.45667h-220.88335c-71.32686,0-129.14889-57.82202-129.14889-129.14889S77.64197,17.19926,148.96884,17.19926h154.97866ZM148.96884,68.85881c-42.79607,0-77.48933,34.69327-77.48933,77.48933s34.69327,77.48933,77.48933,77.48933,77.48933-34.69327,77.48933-77.48933-34.69327-77.48933-77.48933-77.48933Z" />
    </svg>
  );
}
