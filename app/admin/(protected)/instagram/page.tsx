import InstagramFeedEditor from '@/components/admin/InstagramFeedEditor';
import { requireAdminPermission } from '@/lib/admin-auth';
import { getInstagramFeed } from '@/lib/instagram';

export default async function InstagramAdminPage() {
  await requireAdminPermission('content:write');
  const feed = await getInstagramFeed();
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Instagram</h1><p>The posts and reels in the &ldquo;Follow along&rdquo; section of the homepage. Add a post by pasting its link.</p></div></div>
      <InstagramFeedEditor initialFeed={JSON.parse(JSON.stringify(feed))} />
    </div>
  );
}
