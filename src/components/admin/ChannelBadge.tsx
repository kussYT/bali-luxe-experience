import { Badge } from "@/components/ui/badge";

const CHANNEL_STYLES: Record<string, string> = {
  website: "bg-foreground text-background",
  wolf_badger: "bg-amber-100 text-amber-950 border-amber-200",
  influencer: "bg-violet-100 text-violet-950 border-violet-200",
  other: "bg-muted text-muted-foreground",
};

export function channelLabel(channel: string) {
  if (channel === "website") return "Site web";
  if (channel === "wolf_badger") return "Wolf & Badger";
  if (channel === "influencer") return "Influenceur";
  return "Autre";
}

export function ChannelBadge({ channel }: { channel: string }) {
  return (
    <Badge variant="outline" className={CHANNEL_STYLES[channel] || CHANNEL_STYLES.other}>
      {channelLabel(channel)}
    </Badge>
  );
}
