import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

function getAdminServices() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-6230387584-473b3';

  if (!serviceAccountKey || !serviceAccountKey.trim()) {
    return {
      auth: null,
      db: null,
      hasCredentials: false,
      credentialError: 'FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment.',
    };
  }

  if (!getApps().length) {
    try {
      let parsedKey: any;
      if (serviceAccountKey.trim().startsWith('{')) {
        parsedKey = JSON.parse(serviceAccountKey.trim());
      } else {
        // Fallback if environment variable contains raw object string
        parsedKey = JSON.parse(serviceAccountKey);
      }

      if (parsedKey && typeof parsedKey.private_key === 'string') {
        parsedKey.private_key = parsedKey.private_key.replace(/\\n/g, '\n');
      }

      initializeApp({
        credential: cert(parsedKey),
        projectId: parsedKey.project_id || projectId,
      });
    } catch (e: any) {
      console.error('Failed to parse or initialize FIREBASE_SERVICE_ACCOUNT_KEY:', e?.message);
      return {
        auth: null,
        db: null,
        hasCredentials: false,
        credentialError: `Failed to initialize Firebase Admin SDK: ${e?.message || String(e)}`,
      };
    }
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
    hasCredentials: true,
    credentialError: null,
  };
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Missing Authorization header with Admin Bearer token.' },
        { status: 401 }
      );
    }

    const { auth, db, hasCredentials, credentialError } = getAdminServices();

    if (!hasCredentials || !auth || !db) {
      return NextResponse.json({
        success: true,
        hasServiceAccount: false,
        totalAuthUsers: 0,
        created: 0,
        existing: 0,
        createdCount: 0,
        skippedCount: 0,
        message: 'System Users directory active. Add FIREBASE_SERVICE_ACCOUNT_KEY to .env.local to enable server-side auth user discovery.',
        details: credentialError,
      });
    }

    // 1. Verify caller ID token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (authErr: any) {
      console.error('Token verification failed:', authErr);
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'Invalid or expired Firebase ID token.' },
        { status: 401 }
      );
    }

    const callerUid = decodedToken.uid;

    // 2. Check if caller is an Admin
    const userDoc = await db.doc(`users/${callerUid}`).get();
    const adminDoc = await db.doc(`roles_admin/${callerUid}`).get();

    const isCallerAdmin =
      adminDoc.exists ||
      (userDoc.exists && userDoc.data()?.role === 'admin') ||
      decodedToken.role === 'admin';

    if (!isCallerAdmin) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Administrator privileges required.' },
        { status: 403 }
      );
    }

    // 3. List all users from Firebase Auth
    let authUsers: any[] = [];
    try {
      let pageToken: string | undefined;
      do {
        const result = await auth.listUsers(1000, pageToken);
        if (result && Array.isArray(result.users)) {
          authUsers.push(...result.users);
        }
        pageToken = result.pageToken;
      } while (pageToken);
    } catch (listErr: any) {
      console.warn('admin.auth().listUsers() notice:', listErr?.message);
      return NextResponse.json({
        success: true,
        hasServiceAccount: false,
        totalAuthUsers: 0,
        created: 0,
        existing: 0,
        createdCount: 0,
        skippedCount: 0,
        message: 'System Users directory active. Service account credentials required for user listing.',
        details: listErr?.message || String(listErr),
      });
    }

    // 4. Synchronize into Firestore users collection safely
    let created = 0;
    let existing = 0;

    for (const authUser of authUsers) {
      if (!authUser || !authUser.uid) continue;
      const userRef = db.doc(`users/${authUser.uid}`);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        await userRef.set({
          uid: authUser.uid,
          displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Registered User',
          email: authUser.email || '',
          role: 'user',
          createdAt: authUser.metadata?.creationTime
            ? new Date(authUser.metadata.creationTime)
            : FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        created++;
      } else {
        // Document exists - preserve role and existing fields! NEVER overwrite admin or lgu roles.
        existing++;
      }
    }

    return NextResponse.json({
      success: true,
      hasServiceAccount: true,
      totalAuthUsers: authUsers.length,
      created,
      existing,
      createdCount: created,
      skippedCount: existing,
      message: created > 0
        ? `Successfully synchronized ${created} user account(s) into System Users.`
        : `All ${authUsers.length} registered account(s) are synchronized in System Users.`,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/sync-users:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: err?.message || 'An unexpected error occurred during user synchronization.',
      },
      { status: 500 }
    );
  }
}
