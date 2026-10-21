'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { requireAdminPermission } from './admin-auth';
import { appointmentSettingsSchema } from './appointment-slots';
import { saveStoreSettings } from './settings';

export async function saveAppointmentSettingsAction(_previousState, formData) {
  const session = await requireAdminPermission('appointments:manage');
  try {
    const parsed = appointmentSettingsSchema.parse(JSON.parse(String(formData.get('settings') || '{}')));
    await saveStoreSettings({ appointments: parsed }, session.email);
    await logActivity({ actor: session.email, type: 'settings', action: 'Updated appointment availability' });
    revalidatePath('/admin/appointments');
    return { ok: true, message: 'Availability saved. The booking calendar is updated.' };
  } catch (error) {
    return { ok: false, message: error.issues ? error.issues[0].message : 'Could not save availability.' };
  }
}
