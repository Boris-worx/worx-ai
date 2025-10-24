import { UserRole, AccessLevel, AccessSection } from '../components/AuthContext';

interface AzureAuthClaim {
  typ: string;
  val: string;
}

interface AzureAuthResponse {
  access_token?: string;
  expires_on?: string;
  id_token?: string;
  provider_name?: string;
  user_claims?: AzureAuthClaim[];
  user_id?: string;
}

/**
 * Parse Azure AD role to application role
 */
export function parseAzureRole(azureRoles: string[]): UserRole {
  // Admin roles
  if (azureRoles.includes('Portal.Admin')) return 'admin';
  
  // Editor roles
  if (azureRoles.includes('Portal.Editor')) return 'edit';
  
  // Default to view for all other roles (including Portal.Reader)
  return 'view';
}

/**
 * Parse Azure AD roles to determine section access
 * Uses role-based access control (RBAC) pattern
 * 
 * Supported roles:
 * - Portal.Admin → Full access to all sections
 * - Portal.Editor → Full access to all sections
 * - Portal.Reader → Full access to all sections
 * - Portal.Tenants → Access only to Tenants section
 * - Portal.Transactions → Access only to Transactions section
 * - Portal.DataPlane → Access only to Data Plane section
 * 
 * Multiple roles can be combined, e.g.:
 * - ["Portal.Tenants", "Portal.Transactions"] → Access to Tenants and Transactions
 */
export function parseAzureAccess(azureRoles: string[]): AccessLevel {
  // Admin, Editor, and Reader have access to all sections
  if (azureRoles.includes('Portal.Admin') || 
      azureRoles.includes('Portal.Editor') || 
      azureRoles.includes('Portal.Reader')) {
    return 'All';
  }
  
  // Build access list based on section-specific roles
  const accessSections: AccessSection[] = [];
  
  if (azureRoles.includes('Portal.Tenants')) {
    accessSections.push('Tenants');
  }
  
  if (azureRoles.includes('Portal.Transactions')) {
    accessSections.push('Transactions');
  }
  
  if (azureRoles.includes('Portal.DataPlane')) {
    accessSections.push('Data Plane');
  }
  
  // If user has specific section roles, return them
  if (accessSections.length > 0) {
    return accessSections;
  }
  
  // Default: no access (empty array)
  return [];
}

/**
 * Extract user information from Azure AD auth response
 */
export function extractUserInfo(authData: AzureAuthResponse) {
  const claims = authData.user_claims || [];
  
  // Find email claim - Azure AD uses full URI for claim types
  const emailClaim = claims.find(
    (c) => c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress' || 
           c.typ === 'preferred_username' ||
           c.typ === 'email' ||
           c.typ === 'emails'
  );
  
  // Find ALL role claims (Azure AD can return multiple role claims)
  const roleClaims = claims.filter((c) => 
    c.typ === 'roles' || 
    c.typ === 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
  );
  
  // Find name claim
  const nameClaim = claims.find((c) => c.typ === 'name');
  
  // Get user ID from top level or from claims
  const userId = authData.user_id || emailClaim?.val || 'unknown';
  
  // Extract all roles from claims
  const azureRoles: string[] = [];
  roleClaims.forEach(claim => {
    // Role value can be comma-separated or single value
    const roles = claim.val.split(',').map(r => r.trim());
    azureRoles.push(...roles);
  });
  
  // If no roles found, default to Portal.Reader
  const finalRoles = azureRoles.length > 0 ? azureRoles : ['Portal.Reader'];
  
  // Get primary role for display (first one or highest privilege)
  const primaryRole = finalRoles.includes('Portal.Admin') 
    ? 'Portal.Admin' 
    : finalRoles.includes('Portal.Editor') 
    ? 'Portal.Editor' 
    : finalRoles[0];
  
  return {
    email: emailClaim?.val || userId || 'unknown@user.com',
    name: nameClaim?.val || emailClaim?.val || 'Unknown User',
    azureRole: primaryRole,
    azureRoles: finalRoles, // All roles assigned to user
    role: parseAzureRole(finalRoles),
    access: parseAzureAccess(finalRoles),
    userId: userId,
  };
}

/**
 * Fetch user authentication data from Azure AD
 */
export async function fetchAzureAuthData(): Promise<{
  email: string;
  name: string;
  role: UserRole;
  azureRole: string;
  access: AccessLevel;
  userId: string;
} | null> {
  try {
    const response = await fetch('/.auth/me', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // In development mode, this endpoint won't exist, which is expected
    if (!response.ok) {
      if (response.status === 404) {
        // Silently handle 404 - this is expected when not running on Azure
        console.log('Azure AD endpoint not available (local development mode)');
      } else {
        console.error('Failed to fetch Azure auth data:', response.status);
      }
      return null;
    }

    const data: AzureAuthResponse[] = await response.json();
    
    // The response is an array with one element containing user_claims
    if (!data || data.length === 0 || !data[0]?.user_claims) {
      console.log('No Azure AD authentication found');
      return null;
    }

    const userInfo = extractUserInfo(data[0]);
    
    console.log('Azure AD authentication successful:', {
      email: userInfo.email,
      role: userInfo.role,
      azureRole: userInfo.azureRole,
      azureRoles: userInfo.azureRoles, // Log all roles
      access: userInfo.access,
    });
    
    return userInfo;
  } catch (error) {
    // Silently handle network errors in development
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log('Azure AD not configured (local development mode)');
    } else {
      console.error('Error fetching Azure auth data:', error);
    }
    return null;
  }
}

/**
 * Check if the app is running in Azure with authentication enabled
 */
export function isAzureAuthEnabled(): boolean {
  // Check if we're in production environment with Azure auth
  return window.location.hostname.includes('azurewebsites.net') || 
         window.location.hostname.includes('azure.com');
}