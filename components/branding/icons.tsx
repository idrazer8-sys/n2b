type IconProps = {
  className?: string;
  size?: number;
};

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Svg({ size = 20, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.5" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.5" />
    </Svg>
  );
}

export function MenuBookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 5.5c2-1 5-1 8 0v13c-3-1-6-1-8 0z" />
      <path d="M20 5.5c-2-1-5-1-8 0v13c3-1 6-1 8 0z" />
    </Svg>
  );
}

export function TableIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 8.5h17" />
      <path d="M6 8.5v10M18 8.5v10" />
      <path d="M3.5 8.5 5 4.5h14l1.5 4" />
    </Svg>
  );
}

export function OrdersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4.5h14v15H5z" />
      <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
    </Svg>
  );
}

export function AnalyticsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20V9M11 20V4M18 20v-7" />
      <path d="M3 20h18" />
    </Svg>
  );
}

export function PaymentsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M6.5 14.5h3" />
    </Svg>
  );
}

export function StaffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9" r="2.25" />
      <path d="M15.5 19c.2-2.2 1.6-3.8 3.5-4" />
    </Svg>
  );
}

export function KitchenIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 11a6 6 0 0 1 12 0z" />
      <path d="M5 11h14v2.5H5z" />
      <path d="M7 17.5h10" />
      <path d="M8.5 20h7" />
    </Svg>
  );
}

export function WaiterBellIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 17a8 8 0 0 1 16 0z" />
      <path d="M3 17h18" />
      <path d="M12 5v2.5" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.55 1.55M7.15 16.85 5.6 18.4M18.4 18.4l-1.55-1.55M7.15 7.15 5.6 5.6" />
    </Svg>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <path d="M14.5 14.5h3v3h-3zM20.5 14.5v3M14.5 20.5h3" />
    </Svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5a13 13 0 0 1 0 17M12 3.5a13 13 0 0 0 0 17" />
    </Svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5l2.6 5.4 5.9.7-4.4 4.1 1.2 5.8-5.3-2.9-5.3 2.9 1.2-5.8-4.4-4.1 5.9-.7z" />
    </Svg>
  );
}

export function MembershipIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9 13.5 7.5 20l4.5-2.5 4.5 2.5-1.5-6.5" />
    </Svg>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 4h-4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
    </Svg>
  );
}
