import { NavMegaBand } from "@/components/site/NavMegaBand";
import { useRegionalCatalog } from "@/lib/use-regional-catalog";
import { useSiteContent } from "@/lib/content-context";
import { getMegaMenuContent, type MegaMenuId } from "@/lib/navigation";

type NavSectionMegaBandProps = {
  mega: MegaMenuId;
  onNavigate?: () => void;
  className?: string;
};

export function NavSectionMegaBand({ mega, onNavigate, className = "" }: NavSectionMegaBandProps) {
  const { collections, regionalProducts } = useRegionalCatalog();
  const { homepage } = useSiteContent();
  const { columns, featured } = getMegaMenuContent(
    mega,
    collections,
    regionalProducts,
    homepage.megaMenuFeatured,
  );

  return (
    <NavMegaBand columns={columns} featured={featured} onNavigate={onNavigate} className={className} />
  );
}
