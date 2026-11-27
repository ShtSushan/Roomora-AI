// Small inline icons. They inherit the text colour (currentColor).
function Svg({ children, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const ImageIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m21 16-5-5-8 8" />
  </Svg>
);

export const DownloadIcon = (props) => (
  <Svg {...props}>
    <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
  </Svg>
);

export const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
  </Svg>
);

export const CheckIcon = (props) => (
  <Svg {...props}>
    <path d="m5 12 5 5 9-10" />
  </Svg>
);

export const ChevronsIcon = (props) => (
  <Svg {...props}>
    <path d="m8 8-4 4 4 4M16 8l4 4-4 4" />
  </Svg>
);

export const AlertIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.01" />
  </Svg>
);

export const FolderIcon = (props) => (
  <Svg {...props}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  </Svg>
);