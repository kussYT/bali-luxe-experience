import { NavMegaBand } from "@/components/site/NavMegaBand";
import { useCatalog } from "@/lib/catalog-context";
import { getMegaMenuContent, type MegaMenuId } from "@/lib/navigation";

type NavSectionMegaBandProps = {
  mega: MegaMenuId;
  onNavigate?: () => void;
  className?: string;
};

export function NavSectionMegaBand({ mega, onNavigate, className = "" }: NavSectionMegaBandProps) {
  const { collections, publishedProducts } = useCatalog();
  const { columns, featured } = getMegaMenuContent(mega, collections, publishedProducts);

  return (
    <NavMegaBand columns={columns} featured={featured} onNavigate={onNavigate} className={className} />
  );
}
