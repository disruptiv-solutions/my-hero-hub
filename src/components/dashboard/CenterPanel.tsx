"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Calendar,
  Mail,
  Users,
  DollarSign,
  TrendingUp,
  StickyNote,
  MessageSquare,
} from "lucide-react";

type CenterPanelProps = {
  children: ReactNode;
};

const navItems = [
  {
    href: "/dashboard/calendar",
    label: "Calendar",
    Icon: Calendar,
  },
  {
    href: "/dashboard/email",
    label: "Email",
    Icon: Mail,
  },
  {
    href: "/dashboard/clients",
    label: "Clients",
    Icon: Users,
  },
  {
    href: "/dashboard/financial",
    label: "Financial",
    Icon: DollarSign,
  },
  {
    href: "/dashboard/marketing",
    label: "Marketing",
    Icon: TrendingUp,
  },
  {
    href: "/dashboard/notes",
    label: "Notes",
    Icon: StickyNote,
  },
  {
    href: "/dashboard/chat",
    label: "Chat",
    Icon: MessageSquare,
  },
];

const CenterPanel = ({ children }: CenterPanelProps) => {
  const pathname = usePathname();

  return (
    <div className="h-full bg-gray-900 p-6 overflow-y-auto">
      <nav className="w-full mb-6">
        <ul className="flex flex-wrap gap-2">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname?.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
                    isActive
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-6">{children}</div>
    </div>
  );
};

export default CenterPanel;


