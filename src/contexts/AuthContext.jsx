import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [brands, setBrands] = useState([]);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        setBrands([]);
        setCurrentBrand(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId) {
    try {
      // Wait a bit for profile to be created by trigger (if new user)
      let profileData = null;
      let retries = 0;
      const maxRetries = 5;

      while (!profileData && retries < maxRetries) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = not found, which is OK for new users
          throw error;
        }

        if (data) {
          profileData = data;
          break;
        }

        // Wait before retry (for trigger to create profile)
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      if (!profileData) {
        console.warn('Profile not found after retries, user may need to be added manually');
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Load user's brands
      const { data: brandsData, error: brandsError } = await supabase
        .rpc('get_user_brands', { user_uuid: userId });

      if (brandsError) {
        // If function doesn't exist or user has no brands, that's OK
        console.warn('Error loading brands:', brandsError);
        setBrands([]);
        setCurrentBrand(null);
        setLoading(false);
        return;
      }

      setBrands(brandsData || []);

      // Set current brand (first brand or from localStorage)
      if (brandsData && brandsData.length > 0) {
        const savedBrandId = localStorage.getItem('currentBrandId');
        const savedBrand = brandsData.find(b => b.brand_id === savedBrandId);
        setCurrentBrand(savedBrand || brandsData[0]);
        if (savedBrand) {
          localStorage.setItem('currentBrandId', savedBrand.brand_id);
        } else {
          localStorage.setItem('currentBrandId', brandsData[0].brand_id);
        }
      } else {
        setCurrentBrand(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error) throw error;
  return data;
}



  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setBrands([]);
    setCurrentBrand(null);
    localStorage.removeItem('currentBrandId');
    // Navigation will be handled by the component calling signOut
    window.location.href = '/login';
  }

  function switchBrand(brandId) {
    const brand = brands.find(b => b.brand_id === brandId);
    if (brand) {
      setCurrentBrand(brand);
      localStorage.setItem('currentBrandId', brandId);
    }
  }

  const value = {
    user,
    profile,
    brands,
    currentBrand,
    loading,
    signInWithGoogle,
    signOut,
    switchBrand,
    isAuthenticated: !!user,
    isSuperAdmin: profile?.role === 'super_admin',
    isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
    canEdit: profile?.role === 'admin' || profile?.role === 'editor' || profile?.role === 'super_admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}