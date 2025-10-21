import { UserRole } from '../components/AuthContext';

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
export function parseAzureRole(azureRole: string): UserRole {
  if (azureRole === 'Portal.Admin') return 'admin';
  if (azureRole === 'Portal.Editor') return 'edit';
  if (azureRole === 'Portal.Reader') return 'view';
  
  // Default to view for unknown roles
  return 'view';
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
  
  // Find role claim
  const roleClaim = claims.find((c) => c.typ === 'roles');
  
  // Find name claim
  const nameClaim = claims.find((c) => c.typ === 'name');
  
  // Get user ID from top level or from claims
  const userId = authData.user_id || emailClaim?.val || 'unknown';
  
  return {
    email: emailClaim?.val || userId || 'unknown@user.com',
    name: nameClaim?.val || emailClaim?.val || 'Unknown User',
    azureRole: roleClaim?.val || 'Portal.Reader',
    role: parseAzureRole(roleClaim?.val || 'Portal.Reader'),
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