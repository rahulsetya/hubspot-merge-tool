import { notFound } from "next/navigation";
import { SEED_GROUPS } from "@/lib/seed-data";
import { ReviewClient } from "./ReviewClient";

export default async function ReviewGroupPage(
  props: PageProps<"/review/[groupId]">
) {
  const { groupId } = await props.params;
  const group = SEED_GROUPS.find((g) => g.id === groupId);
  if (!group) notFound();
  return <ReviewClient groupId={group.id} />;
}
