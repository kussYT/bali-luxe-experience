import { createFileRoute } from "@tanstack/react-router";
import { FindUsPage } from "@/components/site/FindUsPage";

export const Route = createFileRoute("/find-us")({
  head: () => ({
    meta: [
      { title: "Find us — Retailers | Bingin Diaries" },
      {
        name: "description",
        content: "Find Bingin Diaries at select boutiques in Bali, France, Spain, Finland and more.",
      },
    ],
  }),
  component: FindUsPage,
});
