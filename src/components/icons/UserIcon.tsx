interface UserIconProps {
  className?: string;
}

export const UserIcon = ({ className = "h-5 w-5" }: UserIconProps) => {
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
        d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z"
        fill="currentColor"
      />
      <path
        d="M10 12.5C5.02944 12.5 1 16.5294 1 21.5C1 21.7761 1.22386 22 1.5 22H18.5C18.7761 22 19 21.7761 19 21.5C19 16.5294 14.9706 12.5 10 12.5Z"
        fill="currentColor"
      />
    </svg>
  );
};
