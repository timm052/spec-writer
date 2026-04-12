import { getSections } from '@spec-writer/db';
import { LibraryManageClient } from './manage-client';

export const dynamic = 'force-dynamic';

export default async function LibraryManagePage() {
  const sections = await getSections();
  return <LibraryManageClient initialSections={sections} />;
}
