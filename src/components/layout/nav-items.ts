import {
  LayoutDashboard,
  FolderKanban,
  Image as ImageIcon,
  Database,
  LayoutTemplate,
  Sparkles,
  Settings as SettingsIcon,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export const globalNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/workspaces', icon: LayoutDashboard },
  { name: 'Workspaces', href: '/workspaces', icon: FolderKanban },
];

export function workspaceNavItems(workspaceId: string): NavItem[] {
  return [
    { name: 'Dashboard', href: `/workspaces/${workspaceId}`, icon: LayoutDashboard },
    { name: 'Generations', href: `/workspaces/${workspaceId}/generations`, icon: ImageIcon },
    { name: 'Knowledge base', href: `/workspaces/${workspaceId}/knowledge-base`, icon: Database },
    { name: 'Templates', href: `/workspaces/${workspaceId}/templates`, icon: LayoutTemplate },
    { name: 'Assets', href: `/workspaces/${workspaceId}/assets`, icon: Sparkles },
    { name: 'Settings', href: `/workspaces/${workspaceId}/settings`, icon: SettingsIcon },
  ];
}

export const docsNavItems: NavItem[] = [
  { name: 'Docs', href: '/docs', icon: BookOpen },
];
