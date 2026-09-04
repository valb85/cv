import {
  Award, BookOpen, Briefcase, Calendar, Camera, Cloud, Code2, Coffee, Contact,
  Cpu, Database, FileText, Globe, GraduationCap, Grid2x2, Heart, House,
  Languages, Layers, Lightbulb, Link2, Mail, MapPin,
  MonitorSmartphone, PawPrint, Plane, Puzzle, Rocket, Server, Sparkles, Star,
  User, Users, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * A named subset rather than the whole library: block data stores an icon name
 * as text, and an allow-list keeps a typo from crashing a page render.
 *
 * Brand marks are not here - lucide 1.x dropped them; SocialLinks carries its
 * own SVG paths for those.
 */
export const ICONS = {
  award: Award, book: BookOpen, briefcase: Briefcase, calendar: Calendar,
  camera: Camera, cloud: Cloud, code: Code2, coffee: Coffee, contact: Contact,
  cpu: Cpu, database: Database, file: FileText, globe: Globe,
  graduation: GraduationCap, grid: Grid2x2, heart: Heart, home: House,
  languages: Languages, layers: Layers, lightbulb: Lightbulb,
  link: Link2, mail: Mail, mapPin: MapPin,
  devices: MonitorSmartphone, paw: PawPrint, plane: Plane, puzzle: Puzzle,
  rocket: Rocket, server: Server, sparkles: Sparkles, star: Star,
  user: User, users: Users, wrench: Wrench, zap: Zap,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export const isIconName = (value: string): value is IconName => value in ICONS;

export const iconFor = (name: string | undefined): LucideIcon | null =>
  name && isIconName(name) ? ICONS[name] : null;
