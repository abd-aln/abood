import type { LucideProps } from "lucide-react";

export const Icons = {
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      {...props}
    >
      <defs>
        <path
          id="arc"
          d="M 29.289 29.289 A 30 30 0 0 1 70.711 29.289"
          strokeWidth="12"
          fill="none"
        />
      </defs>
      <use href="#arc" stroke="#A5C9FF" transform="rotate(45 50 50)" />
      <use href="#arc" stroke="#6D9DFF" transform="rotate(135 50 50)" />
      <use href="#arc" stroke="#A5C9FF" transform="rotate(225 50 50)" />
      <use href="#arc" stroke="#6D9DFF" transform="rotate(315 50 50)" />
      <path
        d="M50 35 L65 50 L50 65 L35 50 Z"
        fill="#6D9DFF"
        stroke="none"
      />
    </svg>
  ),
};
