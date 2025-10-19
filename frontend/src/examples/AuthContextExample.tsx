// Example of how to use the AuthContext in any component

import { useAuth } from '../contexts/AuthContext';

export function ExampleComponent() {
  const { user, session, supabase } = useAuth();

  // Access the logged-in user
  const userId = user?.id;
  const userEmail = user?.email;

  // Access the session token
  const accessToken = session?.access_token;

  // Use supabase client for queries
  const fetchUserData = async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching data:', error);
      return;
    }
    
    console.log('User data:', data);
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Auth context will automatically update and redirect to login
  };

  return (
    <div>
      <p>User ID: {userId}</p>
      <p>Email: {userEmail}</p>
      <button onClick={fetchUserData}>Fetch My Data</button>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
}
