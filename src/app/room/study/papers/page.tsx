import { KimiPage, KimiTopNav } from "@/components/mucha/KimiPage";
import { palGold } from "@/lib/kimi-palettes";
import { getTheme } from "@/lib/day-theme";
import { DEMO_PAPERS } from "@/lib/papers";
import PapersClient from "./PapersClient";

// Papers digest — auto-filled by kimi-core's paper extension loop (paper_notes),
// read live via the paper_list tool in core mode; a fictional seed otherwise.
export default async function PapersPage() {
  const theme = await getTheme();
  const P = palGold(theme);
  return (
    <KimiPage P={P} vines={false}>
      <KimiTopNav title="PAPERS" sub="study" P={P} backHref="/room/study" />
      <PapersClient initial={DEMO_PAPERS} theme={theme} P={P} />
    </KimiPage>
  );
}
