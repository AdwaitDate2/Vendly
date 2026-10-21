import { randomBytes } from 'node:crypto';
import { getDb } from './mongodb';
import { PROPOSALS_DATA } from '@/data/proposals';

const COLLECTION = 'proposals';
const DOC_ID = 'gallery';

function makeId() {
  return randomBytes(8).toString('hex');
}

/** Normalise static-data entries so they always have an `id` field. */
function hydrate(items) {
  return items.map((item) => ({ id: item.slug || makeId(), image: '', focus: '', ...item }));
}

/** All published proposal stories, falling back to the static seed if none have been saved yet. */
export async function getProposals() {
  try {
    const db = await getDb();
    const saved = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
    if (saved?.proposals?.length) return saved.proposals;
  } catch {
    // fall through to static data
  }
  return hydrate(PROPOSALS_DATA);
}

export async function saveProposals(proposals, actor) {
  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    { _id: DOC_ID },
    { $set: { proposals, updatedAt: new Date(), updatedBy: actor } },
    { upsert: true },
  );
  return proposals;
}
