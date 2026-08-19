import {
  Armchair,
  Droplet,
  Droplets,
  Pill,
  RotateCw,
  ShowerHead,
  Sparkles,
  Sun,
  Utensils,
  Wind,
} from "lucide-react";
import type { TaskCategory } from "@/lib/types";

export function CategoryIcon({ category, size = 20 }: { category: TaskCategory; size?: number }) {
  switch (category) {
    case "dieta":
      return <Utensils size={size} />;
    case "higiene":
      return <Sparkles size={size} />;
    case "medicacao":
      return <Pill size={size} />;
    case "higiene_oral":
      return <Sparkles size={size} />;
    case "inalacao":
      return <Wind size={size} />;
    case "mudanca_decubito":
      return <RotateCw size={size} />;
    case "agua":
      return <Droplet size={size} />;
    case "hidratacao":
      return <Droplets size={size} />;
    case "exercicios":
      return <Armchair size={size} />;
    case "banho":
      return <ShowerHead size={size} />;
    case "banho_sol":
      return <Sun size={size} />;
    case "estimulacao":
      return <Armchair size={size} />;
    default:
      return <Sparkles size={size} />;
  }
}
