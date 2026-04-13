import { getSections, getClauseSets, getDefaultClauseSet } from '@spec-writer/db';
import { LibraryManageClient } from './manage-client';

export const dynamic = 'force-dynamic';

interface LibraryManagePageProps {
  searchParams: Promise<{ setId?: string }>;
}

export default async function LibraryManagePage({ searchParams }: LibraryManagePageProps) {
  const { setId } = await searchParams;

  const clauseSets = await getClauseSets();

  let activeSetId = setId;
  if (!activeSetId || !clauseSets.find((s) => s.id === activeSetId)) {
    const defaultSet = clauseSets[0] ?? (await getDefaultClauseSet());
    activeSetId = defaultSet?.id ?? '';
  }

  const sections = activeSetId ? await getSections(activeSetId) : [];

  return (
    <LibraryManageClient
      initialSections={sections}
      clauseSets={clauseSets}
      activeSetId={activeSetId}
    />
  );
}
