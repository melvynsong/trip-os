import * as React from "react";

export function PlaneIcon({ size = 20, color = "#2176ae", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      aria-hidden="true"
    >
      <path
        d="M2.5 19.5L21.5 12.5C22.0523 12.3158 22.0523 11.6842 21.5 11.5L2.5 4.5C2.22386 4.39464 1.92386 4.60536 1.92386 4.89464V8.5C1.92386 8.77614 2.22386 9 2.5 9H10.5V15H2.5C2.22386 15 1.92386 15.2239 1.92386 15.5V19.1054C1.92386 19.3946 2.22386 19.6054 2.5 19.5Z"
        fill={color}
      />
    </svg>
  );
}

export function PlaneTakeoffIcon({ size = 20, color = "#2176ae", style = {} }) {
  // Plane taking off (ascending)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true">
      <path d="M2 21h20" stroke="#B0C4DE" strokeWidth="1.5" />
      <path d="M3 17l7.5 2 7.5-5.5-2-1.5-5.5 2-3-7.5-2.5-1.5 2.5 8.5-2 1.5z" fill={color} />
    </svg>
  );
}

export function PlaneLandingIcon({ size = 20, color = "#2176ae", style = {} }) {
  // Plane landing (descending)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true">
      <path d="M2 21h20" stroke="#B0C4DE" strokeWidth="1.5" />
      <path d="M21 17l-7.5 2-7.5-5.5 2-1.5 5.5 2 3-7.5 2.5-1.5-2.5 8.5 2 1.5z" fill={color} />
    </svg>
  );
}
