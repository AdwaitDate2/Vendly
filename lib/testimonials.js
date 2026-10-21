import { randomBytes } from 'node:crypto';
import { getDb } from './mongodb';
import { clientStories } from '@/data/client-stories';

const COLLECTION = 'testimonials';
const DOC_ID = 'gallery';

function makeId() {
  return randomBytes(8).toString('hex');
}

function hydrate(items) {
  return items.map((item) => ({ id: makeId(), ...item }));
}

/** All client testimonials, falling back to the static seed if none have been saved yet. */
export async function getTestimonials() {
  try {
    const db = await getDb();
    const saved = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
    if (saved?.testimonials?.length) return saved.testimonials;
  } catch {
    // fall through to static data
  }
  return hydrate(clientStories);
}

export async function saveTestimonials(testimonials, actor) {
  const db = await getDb();
  await db.collection(COLLECTION).updateOne(
    { _id: DOC_ID },
    { $set: { testimonials, updatedAt: new Date(), updatedBy: actor } },
    { upsert: true },
  );
  return testimonials;
}
