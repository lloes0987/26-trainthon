import type { IconType } from "react-icons";
import { HiClock, HiMapPin, HiSparkles } from "react-icons/hi2";

export const MODES: {
  href: string;
  label: string;
  title: string;
  description: string;
  accent: string;
  icon: IconType;
  iconClass: string;
  featured?: boolean;
}[] = [
  {
    href: "/here",
    label: "여기서",
    title: "중간 지점 찾기",
    description: "출발지를 모아 만나기 좋은 중간 장소를 찾아요.",
    accent: "bg-coral-light",
    icon: HiMapPin,
    iconClass: "text-coral",
  },
  {
    href: "/create/time",
    label: "언제",
    title: "겹치는 시간 찾기",
    description: "링크를 공유하고 모두의 가능한 시간을 한눈에 확인해요.",
    accent: "bg-brand-soft",
    icon: HiClock,
    iconClass: "text-brand-dark",
  },
  {
    href: "/create/both",
    label: "여기서언제",
    title: "시간 + 장소 한번에",
    description: "언제 만날지 정하고, 중간 장소까지 함께 정해요.",
    accent: "bg-brand-soft",
    icon: HiSparkles,
    iconClass: "text-brand-dark",
    featured: true,
  },
];
