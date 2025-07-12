import { storage } from "./storage";
import { insertUserSchema, insertInviteCodeSchema } from "@shared/schema";

// Generate a random alphanumeric invite code
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validate invite code and check usage limits
export async function validateInviteCode(code: string): Promise<{ valid: boolean; message?: string; existingUser?: any }> {
  if (!code || code.length < 6 || code.length > 8) {
    return { valid: false, message: "Invalid code format" };
  }

  // For now, use hardcoded codes (can be moved to database later)
  const validCodes = [
    'FIELD001', 'NEXUS001', 'CIVIC001', 'TRUST001', 'LOOP001',
    'SIGNAL01', 'MIRROR01', 'WEAVER01', 'ANCHOR01', 'RIPPLE01'
  ];

  if (!validCodes.includes(code.toUpperCase())) {
    return { valid: false, message: "Invalid invite code" };
  }

  // Check if user already exists with this code (returning user)
  try {
    const existingUsers = await storage.getUsersByInviteCode?.(code) || [];
    if (existingUsers.length > 0) {
      return { 
        valid: true, 
        existingUser: existingUsers[0]
      };
    }
  } catch (error) {
    console.error("Error checking existing users:", error);
  }

  return { valid: true };
}

// Check if pseudonym is available
export async function checkPseudonymAvailability(pseudonym: string): Promise<{ available: boolean; message?: string }> {
  if (!pseudonym || pseudonym.length < 3) {
    return { available: false, message: "Pseudonym must be at least 3 characters" };
  }

  try {
    const existingUser = await storage.getUserByPseudonym?.(pseudonym);
    if (existingUser) {
      return { available: false, message: "Pseudonym already taken" };
    }
    return { available: true };
  } catch (error) {
    console.error("Error checking pseudonym:", error);
    return { available: false, message: "Unable to check availability" };
  }
}

// Create new user with privacy-first approach
export async function createPrivacyUser(userData: {
  pseudonym: string;
  signalRole: string;
  inviteCode: string;
  styleEmoji?: string;
  fieldColor?: string;
}) {
  try {
    const newUser = await storage.createUser({
      username: userData.pseudonym, // Use pseudonym as username for compatibility
      pseudonym: userData.pseudonym,
      signalRole: userData.signalRole,
      inviteCode: userData.inviteCode,
      styleEmoji: userData.styleEmoji,
      fieldColor: userData.fieldColor,
      trustState: "emerging",
      trustTokens: 3,
      isActive: true,
      onboardingCompleted: false,
      hasSeenOrientation: false,
      fieldAgreementSigned: false,
      email: null, // Privacy-first: no email required
      firstName: null,
      lastName: null,
      profileImageUrl: null
    });

    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user account");
  }
}

// Validate session for returning users
export async function validateUserSession(userId: number, pseudonym: string): Promise<{ valid: boolean; user?: any }> {
  try {
    const user = await storage.getUser(userId);
    if (!user || user.pseudonym !== pseudonym) {
      return { valid: false };
    }
    return { valid: true, user };
  } catch (error) {
    console.error("Error validating session:", error);
    return { valid: false };
  }
}