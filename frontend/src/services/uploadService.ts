import { publicAnonKey } from '../../utils/supabase/info';

const API_BASE = 'https://bzrpuvripwivsiongdst.supabase.co/functions/v1/make-server-b67fdaad';
const FALLBACK_API_BASE = 'http://localhost:3000/api'; // Node.js backend fallback

export interface Upload {
  id: string;
  user_id: string;
  type: string;
  file_path: string;
  original_name: string;
  parsed_text?: string;
  created_at: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface UploadsResponse {
  uploads: Upload[];
  pagination: PaginationInfo;
}

export class UploadService {
  private static getHeaders() {
    return {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
    };
  }

  static async getRecentRecordings(
    userId: string = '123e4567-e89b-12d3-a456-426614174000',
    page: number = 1,
    limit: number = 5
  ): Promise<UploadsResponse> {
    const params = new URLSearchParams({
      userId,
      page: page.toString(),
      limit: limit.toString(),
    });

    // Try Supabase Edge Function first
    try {
      console.log('🔄 Trying Supabase Edge Function:', `${API_BASE}/recent-recordings?${params}`);
      const response = await fetch(`${API_BASE}/recent-recordings?${params}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Supabase Edge Function success:', result);
        return result;
      }
      
      console.warn('❌ Supabase Edge Function failed:', response.status, response.statusText);
    } catch (error) {
      console.warn('❌ Supabase Edge Function error:', error);
    }

    // Try Node.js backend fallback
    try {
      console.log('🔄 Trying Node.js backend:', `${FALLBACK_API_BASE}/recent-recordings?${params}`);
      const response = await fetch(`${FALLBACK_API_BASE}/recent-recordings?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Node.js backend success:', result);
        return result;
      }
      
      console.warn('❌ Node.js backend failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Node.js backend error details:', errorText);
    } catch (error) {
      console.warn('❌ Node.js backend error:', error);
    }

    // Return empty response if both APIs fail
    console.warn('Both APIs unavailable, returning empty results');
    return {
      uploads: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
      }
    };
  }

  static async getUploads(
    userId: string = '123e4567-e89b-12d3-a456-426614174000',
    type?: string,
    page: number = 1,
    limit: number = 5
  ): Promise<UploadsResponse> {
    const params = new URLSearchParams({
      userId,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) {
      params.append('type', type);
    }

    // Try Supabase Edge Function first
    try {
      console.log('🔄 Trying Supabase Edge Function:', `${API_BASE}/uploads?${params}`);
      const response = await fetch(`${API_BASE}/uploads?${params}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Supabase Edge Function success:', result);
        return result;
      }
      
      console.warn('❌ Supabase Edge Function failed:', response.status, response.statusText);
    } catch (error) {
      console.warn('❌ Supabase Edge Function error:', error);
    }

    // Try Node.js backend fallback
    try {
      console.log('🔄 Trying Node.js backend:', `${FALLBACK_API_BASE}/uploads?${params}`);
      const response = await fetch(`${FALLBACK_API_BASE}/uploads?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Node.js backend success:', result);
        return result;
      }
      
      console.warn('❌ Node.js backend failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Node.js backend error details:', errorText);
    } catch (error) {
      console.warn('❌ Node.js backend error:', error);
    }

    // Return empty response if both APIs fail
    console.warn('Both APIs unavailable, returning empty results');
    return {
      uploads: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
      }
    };
  }

  static async saveUpload(uploadData: {
    id: string;
    userId: string;
    type: string;
    filePath: string;
    originalName: string;
    parsedText?: string;
  }): Promise<{ success: boolean; upload: Upload }> {
    
    // Try Supabase Edge Function first
    try {
      console.log('Attempting to save upload via Supabase Edge Function:', uploadData);
      const response = await fetch(`${API_BASE}/save-upload`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(uploadData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Save upload success via Supabase:', result);
        return result;
      }
      
      console.warn('Supabase Edge Function save failed, trying Node.js fallback');
    } catch (error) {
      console.warn('Supabase Edge Function save error:', error);
    }

    // Try Node.js backend fallback
    try {
      console.log('Attempting to save upload via Node.js backend:', uploadData);
      const response = await fetch(`${FALLBACK_API_BASE}/save-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Save upload success via Node.js:', result);
        return result;
      }
      
      const errorText = await response.text();
      console.error('Node.js backend save failed:', errorText);
    } catch (error) {
      console.error('Node.js backend save error:', error);
    }

    // Return mock success response for graceful degradation
    console.warn('Both APIs failed, returning mock response');
    return {
      success: false,
      upload: {
        id: uploadData.id,
        user_id: uploadData.userId,
        type: uploadData.type,
        file_path: uploadData.filePath,
        original_name: uploadData.originalName,
        parsed_text: uploadData.parsedText,
        created_at: new Date().toISOString(),
      }
    };
  }

  // Convert Upload to the format expected by components
  static convertUploadFormat(upload: Upload): {
    id: string;
    userId: string;
    type: string;
    filePath: string;
    originalName: string;
    createdAt: string;
  } {
    return {
      id: upload.id,
      userId: upload.user_id,
      type: upload.type,
      filePath: upload.file_path,
      originalName: upload.original_name,
      createdAt: upload.created_at,
    };
  }

  // Test API connectivity
  static async testConnection(): Promise<{ success: boolean; error?: string; details?: string }> {
    const results: string[] = [];
    
    // Test Supabase Edge Function
    try {
      console.log('Testing Supabase Edge Function:', `${API_BASE}/health`);
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Supabase health check result:', result);
        results.push('✅ Supabase Edge Function: Connected');
      } else {
        results.push(`❌ Supabase Edge Function: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Supabase health check error:', error);
      results.push(`❌ Supabase Edge Function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test Node.js backend
    try {
      console.log('Testing Node.js backend:', `${FALLBACK_API_BASE}/health`);
      const response = await fetch(`${FALLBACK_API_BASE}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Node.js health check result:', result);
        results.push('✅ Node.js Backend: Connected');
      } else {
        results.push(`❌ Node.js Backend: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Node.js health check error:', error);
      results.push(`❌ Node.js Backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const hasConnection = results.some(result => result.includes('✅'));
    
    return {
      success: hasConnection,
      error: hasConnection ? undefined : 'No API endpoints available',
      details: results.join(' | ')
    };
  }
}