interface LogOutIconProps {
  className?: string;
}

export const LogOutIcon = ({ className = "h-5 w-5" }: LogOutIconProps) => {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 16L17 12M17 12L13 8M17 12H7M7 16H4C3.44772 16 3 15.5523 3 15V5C3 4.44772 3.44772 4 4 4H7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
