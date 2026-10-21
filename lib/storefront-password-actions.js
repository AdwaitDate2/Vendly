'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isIP } from 'node:net';
import { verifyStorefrontPasswordAndGrantAccess } from './storefront-password';

function getTrustedClientAddress(requestHeaders) {
  const configuredHeader = process.env.STOREFRONT_TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase() || '';
  if (!/^[a-z0-9-]+$/.test(configuredHeader)) return 'unknown';

  const clientAddress = requestHeaders.get(configuredHeader)?.trim() || '';
  return isIP(clientAddress) ? clientAddress : 'unknown';
}

export async function unlockStorefront(_previousState, formData) {
  const submittedPassword = String(formData.get('password') || '');
  const requestHeaders = await headers();
  const trustedClientAddress = getTrustedClientAddress(requestHeaders);

  const unlocked = await verifyStorefrontPasswordAndGrantAccess(submittedPassword, trustedClientAddress);
  if (!unlocked) return { message: 'That password didn’t work. Try again.' };
  redirect('/');
}
