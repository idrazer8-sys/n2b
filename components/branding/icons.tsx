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

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4.5v15M4.5 12h15" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 7h15" />
      <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
      <path d="M6.5 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5L17.5 7" />
      <path d="M10 11v6M14 11v6" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 5l14 14M19 5 5 19" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 12.5l5 5 10-11" />
    </Svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9" r="2.25" />
      <path d="M15.5 19c.2-2.2 1.6-3.8 3.5-4" />
    </Svg>
  );
}

export function CreditCardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M6.5 14.5h3" />
    </Svg>
  );
}

export function UtensilsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 3.5v7a1.5 1.5 0 0 0 3 0v-7M8.5 3.5v17M17 3.5c-1.5 1-2.5 3-2.5 5.5S15.5 13 17 13v7.5" />
    </Svg>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5.5" y="4.5" width="13" height="16" rx="1.5" />
      <path d="M9 4.5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M8.5 10.5h7M8.5 14h7M8.5 17.5h4.5" />
    </Svg>
  );
}

export function FloorPlanIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
      <rect x="6" y="6" width="4.5" height="4.5" rx="0.75" />
      <circle cx="16.5" cy="8.25" r="2.25" />
      <rect x="6" y="13" width="12" height="4.5" rx="0.75" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M7.5 13h2.5M11.5 13h2.5M15.5 13h1M7.5 16.5h2.5M11.5 16.5h2.5M15.5 16.5h1" />
    </Svg>
  );
}

export function BanknoteIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
      <circle cx="12" cy="12" r="2.75" />
      <path d="M5.5 9v0M18.5 15v0" />
    </Svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 3.5h13v17l-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5-2.25-1.5-1.75 1.5v-17z" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" />
    </Svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </Svg>
  );
}

export function SpeakerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
      <path d="M16 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
    </Svg>
  );
}

export function SpeakerMuteIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
      <path d="M16.5 9.5l4 4M20.5 9.5l-4 4" />
    </Svg>
  );
}
