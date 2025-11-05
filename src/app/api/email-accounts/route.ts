import { NextRequest, NextResponse } from "next/server";
import { getFirebaseUser } from "@/lib/auth-helpers";
import { adminDb } from "@/lib/firebase-admin";

export interface EmailAccount {
  id: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  isPrimary: boolean;
  addedAt: string;
  label?: string; // User-friendly label
}

/**
 * GET - List all email accounts for the user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user document
    const userRef = adminDb.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ accounts: [] });
    }

    const data = userDoc.data();
    const accounts: EmailAccount[] = data?.emailAccounts || [];
    
    // Also include the primary account if it exists (for backwards compatibility)
    if (data?.googleAccessToken && data?.googleAccessToken) {
      // Check if primary account is already in the list
      const primaryEmail = user.email;
      const hasPrimary = accounts.some(acc => acc.email === primaryEmail);
      
      if (!hasPrimary && primaryEmail) {
        const primaryAccount: any = {
          id: 'primary',
          email: primaryEmail,
          accessToken: data.googleAccessToken,
          isPrimary: true,
          addedAt: data.createdAt || new Date().toISOString(),
          label: 'Primary Account',
        };
        
        // Only add optional fields if they exist (Firestore doesn't allow undefined)
        if (data.googleRefreshToken) {
          primaryAccount.refreshToken = data.googleRefreshToken;
        }
        if (data.googleTokenExpiresAt) {
          primaryAccount.expiresAt = data.googleTokenExpiresAt;
        }
        
        accounts.unshift(primaryAccount);
      }
    }

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("Error fetching email accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch email accounts", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a new email account
 * Body: { email: string, accessToken: string, refreshToken?: string, expiresAt?: number, label?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, accessToken, refreshToken, expiresAt, label } = body;

    if (!email || !accessToken) {
      return NextResponse.json(
        { error: "Email and accessToken are required" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    const existingAccounts: EmailAccount[] = userDoc.data()?.emailAccounts || [];
    
    // Check if account already exists
    if (existingAccounts.some(acc => acc.email === email)) {
      return NextResponse.json(
        { error: "This email account is already connected" },
        { status: 409 }
      );
    }

    const newAccount: EmailAccount = {
      id: `account_${Date.now()}`,
      email,
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt: expiresAt || undefined,
      isPrimary: existingAccounts.length === 0, // First account is primary
      addedAt: new Date().toISOString(),
      label: label || email,
    };

    // Clean up undefined values (Firestore doesn't allow undefined)
    const cleanAccount = Object.fromEntries(
      Object.entries(newAccount).filter(([_, v]) => v !== undefined)
    ) as EmailAccount;

    // Clean existing accounts too
    const cleanExistingAccounts = existingAccounts.map(acc => 
      Object.fromEntries(
        Object.entries(acc).filter(([_, v]) => v !== undefined)
      )
    );

    // Update user document
    await userRef.set({
      emailAccounts: [...cleanExistingAccounts, cleanAccount],
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ account: cleanAccount }, { status: 201 });

  } catch (error: any) {
    console.error("Error adding email account:", error);
    return NextResponse.json(
      { error: "Failed to add email account", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove an email account
 * Query: ?accountId=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingAccounts: EmailAccount[] = userDoc.data()?.emailAccounts || [];
    const updatedAccounts = existingAccounts.filter(acc => acc.id !== accountId);

    if (updatedAccounts.length === existingAccounts.length) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // If we removed the primary account, make the first remaining account primary
    const removedAccount = existingAccounts.find(acc => acc.id === accountId);
    if (removedAccount?.isPrimary && updatedAccounts.length > 0) {
      updatedAccounts[0].isPrimary = true;
    }

    // Clean undefined values from accounts before saving
    const cleanUpdatedAccounts = updatedAccounts.map(acc => 
      Object.fromEntries(
        Object.entries(acc).filter(([_, v]) => v !== undefined)
      )
    );

    await userRef.update({
      emailAccounts: cleanUpdatedAccounts,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing email account:", error);
    return NextResponse.json(
      { error: "Failed to remove email account", details: error.message },
      { status: 500 }
    );
  }
}

