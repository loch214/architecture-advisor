import type { Metadata } from "next";
import { Advisor } from "@/components/advisor/advisor";

export const metadata: Metadata = {
  title: "Advisor",
  description: "Answer four short steps and get a ranked, explained recommendation of architecture styles.",
};

export default function AdvisorPage() {
  return <Advisor />;
}
