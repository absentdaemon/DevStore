/**
 * DevStore Supabase Backend Integration Adapter
 * Manages Supabase Auth, PostgreSQL Database, Private Package Storage,
 * and Role-Based Access Control (User, Developer, Admin).
 */

export class SupabaseBackendClient {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.config = {
      maxPackageSizeBytes: 250 * 1024 * 1024, // 250 MB
      allowedPackageExtensions: ['.zip', '.apk', '.tar.gz', '.msi', '.exe']
    };

    this.initClient();
  }

  initClient() {
    const globalConfig = window.DEVSTORE_CONFIG || {};
    const url = globalConfig.supabaseUrl;
    const key = globalConfig.supabaseAnonKey;

    if (globalConfig.maxPackageSizeBytes) {
      this.config.maxPackageSizeBytes = globalConfig.maxPackageSizeBytes;
    }
    if (Array.isArray(globalConfig.allowedPackageExtensions)) {
      this.config.allowedPackageExtensions = globalConfig.allowedPackageExtensions;
    }

    if (url && key && !url.includes('your-project-id') && typeof window.supabase !== 'undefined') {
      try {
        this.client = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
    }
  }

  // --------------------------------------------------------------------------
  // Safety & File Validation Utilities
  // --------------------------------------------------------------------------

  /**
   * Calculates SHA-256 checksum for a File or ArrayBuffer in the browser.
   * @param {File|ArrayBuffer} fileOrBuffer
   * @returns {Promise<string>} 64-character lowercase hexadecimal hash
   */
  async calculateSha256(fileOrBuffer) {
    let arrayBuffer;
    if (fileOrBuffer instanceof ArrayBuffer) {
      arrayBuffer = fileOrBuffer;
    } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else {
      throw new Error('Invalid input: expected File or ArrayBuffer');
    }

    if (!crypto || !crypto.subtle || !crypto.subtle.digest) {
      throw new Error('Web Cryptography API is unavailable in this environment');
    }

    const digestBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(digestBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validates file format and size for uploaded packages.
   * @param {File} file
   * @returns {{ valid: boolean, error?: string }}
   */
  validatePackageFile(file) {
    if (!file || !file.name) {
      return { valid: false, error: 'No file selected for upload.' };
    }

    const filename = file.name.toLowerCase();
    const hasValidExt = this.config.allowedPackageExtensions.some(ext => filename.endsWith(ext));
    if (!hasValidExt) {
      return {
        valid: false,
        error: `Invalid file format. Allowed file extensions: ${this.config.allowedPackageExtensions.join(', ')}`
      };
    }

    if (file.size <= 0) {
      return { valid: false, error: 'Selected file is empty (0 bytes).' };
    }

    if (file.size > this.config.maxPackageSizeBytes) {
      const maxMb = (this.config.maxPackageSizeBytes / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `File size exceeds the maximum limit of ${maxMb} MB (file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`
      };
    }

    return { valid: true };
  }

  // --------------------------------------------------------------------------
  // Authentication & Profile Services
  // --------------------------------------------------------------------------

  async getSession() {
    if (!this.isConfigured || !this.client) return null;
    const { data, error } = await this.client.auth.getSession();
    if (error) {
      console.warn('Supabase getSession error:', error);
      return null;
    }
    return data.session;
  }

  async getCurrentProfile() {
    if (!this.isConfigured || !this.client) return null;
    const session = await this.getSession();
    if (!session || !session.user) return null;

    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching profile from Supabase:', error);
      return {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
        role: 'user',
        isVerified: true,
        isDemo: false
      };
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: data?.full_name || session.user.user_metadata?.full_name || session.user.email.split('@')[0],
      role: data?.role || 'user',
      avatarUrl: data?.avatar_url,
      avatarBg: data?.role === 'admin' ? 'linear-gradient(135deg, #d93025 0%, #ea4335 100%)' :
                data?.role === 'developer' ? 'linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)' :
                'linear-gradient(135deg, #01875f 0%, #34a853 100%)',
      isVerified: true,
      isDemo: false
    };
  }

  async signUp(email, password, fullName) {
    if (!this.isConfigured || !this.client) {
      throw new Error('Supabase backend is not configured. Please see supabase/README.md for setup instructions.');
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) throw error;
    return data;
  }

  async signInWithPassword(email, password) {
    if (!this.isConfigured || !this.client) {
      throw new Error('Supabase backend is not configured.');
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signInWithOtp(email) {
    if (!this.isConfigured || !this.client) {
      throw new Error('Supabase backend is not configured.');
    }

    const { data, error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return data;
  }

  async resetPassword(email) {
    if (!this.isConfigured || !this.client) {
      throw new Error('Supabase backend is not configured.');
    }

    const { data, error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#reset-password`
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!this.isConfigured || !this.client) return;
    const { error } = await this.client.auth.signOut();
    if (error) console.warn('Supabase sign out error:', error);
  }

  onAuthStateChange(callback) {
    if (!this.isConfigured || !this.client) return { unsubscribe: () => {} };
    const { data } = this.client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return data.subscription;
  }

  // --------------------------------------------------------------------------
  // Developer Access & Applications
  // --------------------------------------------------------------------------

  async getDeveloperApplication() {
    if (!this.isConfigured || !this.client) return null;
    const session = await this.getSession();
    if (!session) return null;

    const { data, error } = await this.client
      .from('developer_applications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching developer application:', error);
      return null;
    }
    return data;
  }

  async applyForDeveloperRole({ organizationName, website, intendedApps }) {
    if (!this.isConfigured || !this.client) {
      throw new Error('Supabase backend is not configured.');
    }
    const session = await this.getSession();
    if (!session) throw new Error('You must be signed in to apply for developer access.');

    const { data, error } = await this.client
      .from('developer_applications')
      .insert({
        user_id: session.user.id,
        organization_name: organizationName,
        website: website || null,
        intended_apps: intendedApps || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDeveloperApps() {
    if (!this.isConfigured || !this.client) return [];
    const session = await this.getSession();
    if (!session) return [];

    const { data, error } = await this.client
      .from('applications')
      .select('*, app_versions(*)')
      .eq('developer_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching developer applications:', error);
      return [];
    }
    return data || [];
  }

  async createOrUpdateAppListing(appData) {
    if (!this.isConfigured || !this.client) {
      throw new Error('Supabase backend is not configured.');
    }
    const session = await this.getSession();
    if (!session) throw new Error('Unauthorized');

    const payload = {
      id: appData.id,
      developer_id: session.user.id,
      name: appData.name,
      slug: appData.slug || appData.id.replace(/[^a-z0-9_-]/gi, '-').toLowerCase(),
      category: appData.category,
      summary: appData.summary,
      description: appData.description,
      icon_url: appData.icon_url || null,
      status: appData.status || 'draft',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.client
      .from('applications')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Uploads package binary to private storage, validates checksum and size,
   * and creates a pending app_version row for moderation.
   */
  async submitAppVersion({ appId, version, platform, releaseNotes, file }) {
    if (!this.isConfigured || !this.client) {
      throw new Error('Supabase backend is not configured.');
    }
    const session = await this.getSession();
    if (!session) throw new Error('Unauthorized');

    // 1. Validation check
    const validation = this.validatePackageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 2. Compute SHA-256 Checksum in client
    const checksum = await this.calculateSha256(file);

    // 3. Upload to private 'app-packages' bucket
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${session.user.id}/${appId}/${platform}/${version}/${cleanFileName}`;

    const { error: uploadError } = await this.client.storage
      .from('app-packages')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Package upload failed: ${uploadError.message}`);
    }

    // 4. Create pending version row in PostgreSQL
    const { data, error: dbError } = await this.client
      .from('app_versions')
      .insert({
        app_id: appId,
        version: version,
        platform: platform,
        package_path: storagePath,
        file_size_bytes: file.size,
        sha256_checksum: checksum,
        release_notes: releaseNotes || '',
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to record release version: ${dbError.message}`);
    }

    // Also mark app status as pending review if it was draft
    await this.client
      .from('applications')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', appId)
      .eq('status', 'draft');

    return { ...data, checksum };
  }

  // --------------------------------------------------------------------------
  // Admin Moderation Services
  // --------------------------------------------------------------------------

  async getAdminPendingDeveloperApplications() {
    if (!this.isConfigured || !this.client) return [];
    const { data, error } = await this.client
      .from('developer_applications')
      .select('*, profiles!developer_applications_user_id_fkey(email, full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching pending developer applications:', error);
      return [];
    }
    return data || [];
  }

  async getAdminPendingVersions() {
    if (!this.isConfigured || !this.client) return [];
    const { data, error } = await this.client
      .from('app_versions')
      .select('*, applications(name, slug, category, developer_id, profiles(email, full_name))')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.warn('Error fetching pending versions:', error);
      return [];
    }
    return data || [];
  }

  async getModerationAuditLogs() {
    if (!this.isConfigured || !this.client) return [];
    const { data, error } = await this.client
      .from('moderation_audit_logs')
      .select('*, profiles!moderation_audit_logs_admin_id_fkey(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Error fetching moderation audit logs:', error);
      return [];
    }
    return data || [];
  }

  async adminApproveDeveloper(applicationId, notes = '') {
    if (!this.isConfigured || !this.client) throw new Error('Not configured');
    const { error } = await this.client.rpc('admin_approve_developer_application', {
      app_id: applicationId,
      notes: notes
    });
    if (error) throw error;
  }

  async adminRejectDeveloper(applicationId, notes = '') {
    if (!this.isConfigured || !this.client) throw new Error('Not configured');
    const { error } = await this.client.rpc('admin_reject_developer_application', {
      app_id: applicationId,
      notes: notes
    });
    if (error) throw error;
  }

  async adminApproveVersion(versionId, feedback = '') {
    if (!this.isConfigured || !this.client) throw new Error('Not configured');
    const { error } = await this.client.rpc('admin_approve_version', {
      ver_id: versionId,
      feedback: feedback
    });
    if (error) throw error;
  }

  async adminRejectVersion(versionId, feedback = '') {
    if (!this.isConfigured || !this.client) throw new Error('Not configured');
    const { error } = await this.client.rpc('admin_reject_version', {
      ver_id: versionId,
      feedback: feedback
    });
    if (error) throw error;
  }

  // --------------------------------------------------------------------------
  // Secure Downloads (Signed URL Generation for Approved Releases)
  // --------------------------------------------------------------------------

  async getSignedDownloadUrl(packagePath, expiresInSeconds = 3600) {
    if (!this.isConfigured || !this.client) {
      throw new Error('Supabase backend is not configured.');
    }

    const { data, error } = await this.client.storage
      .from('app-packages')
      .createSignedUrl(packagePath, expiresInSeconds);

    if (error) throw error;
    return data.signedUrl;
  }

  // --------------------------------------------------------------------------
  // Community Reviews & Favorites
  // --------------------------------------------------------------------------

  async submitReview({ appId, rating, comment, device }) {
    if (!this.isConfigured || !this.client) {
      throw new Error('Supabase backend is not configured.');
    }
    const session = await this.getSession();
    if (!session) throw new Error('You must be signed in to post a review.');

    const { data, error } = await this.client
      .from('reviews')
      .upsert({
        app_id: appId,
        user_id: session.user.id,
        rating: rating,
        comment: comment,
        device: device || 'Desktop',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async fetchAppReviews(appId) {
    if (!this.isConfigured || !this.client) return [];
    const { data, error } = await this.client
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('app_id', appId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching reviews:', error);
      return [];
    }

    return (data || []).map(r => ({
      id: r.id,
      author: r.profiles?.full_name || 'Verified User',
      rating: r.rating,
      comment: r.comment,
      device: r.device,
      helpfulCount: r.helpful_count,
      date: new Date(r.created_at).toLocaleDateString(),
      avatar: '#01875f'
    }));
  }

  async toggleFavorite(appId) {
    if (!this.isConfigured || !this.client) return null;
    const session = await this.getSession();
    if (!session) return null;

    const { data: existing } = await this.client
      .from('favorites')
      .select('app_id')
      .eq('user_id', session.user.id)
      .eq('app_id', appId)
      .maybeSingle();

    if (existing) {
      await this.client
        .from('favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('app_id', appId);
      return false; // Removed
    } else {
      await this.client
        .from('favorites')
        .insert({
          user_id: session.user.id,
          app_id: appId
        });
      return true; // Added
    }
  }

  async getUserFavorites() {
    if (!this.isConfigured || !this.client) return [];
    const session = await this.getSession();
    if (!session) return [];

    const { data, error } = await this.client
      .from('favorites')
      .select('app_id')
      .eq('user_id', session.user.id);

    if (error) return [];
    return (data || []).map(f => f.app_id);
  }
}

export const supabaseBackend = new SupabaseBackendClient();
