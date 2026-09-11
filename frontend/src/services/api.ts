import {
  Profile,
  Job,
  Application,
  Message,
  ChatConversation,
  EmployerStats,
  SavedJobItem,
  RecentlyViewedItem,
  ApplicationStatus,
} from '../types';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const localApiBaseUrl = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : `http://${window.location.hostname}:8000/api`)
  : 'http://localhost:8000/api';
const API_BASE_URL = configuredApiBaseUrl || localApiBaseUrl;

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('skillmatch_token');
  }

  private getHeaders(contentType: string | null = 'application/json'): HeadersInit {
    const headers: Record<string, string> = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(
            options.body instanceof FormData ? null : 'application/json'
          ),
          ...(options.headers || {}),
        },
      });
    } catch (networkError: any) {
      throw new Error(
        'Unable to connect to the backend server. Please check your connection or server status.'
      );
    }

    if (!response.ok) {
      let errorMsg = '';
      try {
        const errorData = await response.json();
        errorMsg =
          errorData.error ||
          errorData.detail ||
          errorData.message ||
          (typeof errorData === 'string' ? errorData : '');
      } catch {
        // failed to parse JSON error response
      }

      if (!errorMsg) {
        if (response.status === 401) {
          errorMsg = 'Your session has expired. Please sign in again.';
        } else if (response.status === 403) {
          errorMsg = 'Permission denied.';
        } else if (response.status === 504) {
          errorMsg = 'Storage service timed out. Please try again.';
        } else if (response.status >= 500) {
          errorMsg = 'Server error. Please try again.';
        } else {
          errorMsg = `HTTP Error ${response.status}`;
        }
      }
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
  }

  // --- HEALTH ---
  async checkHealth() {
    return this.request<{ status: string; database: string; stats: any }>('/health/');
  }

  // --- AUTH ---
  async login(email: string, password: string) {
    const data = await this.request<{
      session: { access_token: string; refresh_token?: string };
      user: any;
      profile: Profile;
    }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.session?.access_token) {
      localStorage.setItem('skillmatch_token', data.session.access_token);
    }
    return data;
  }

  async register(
    email: string,
    password: string,
    role: 'seeker' | 'employer',
    fullName?: string,
    companyName?: string
  ) {
    const redirectUrl =
      import.meta.env.VITE_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174');

    const data = await this.request<{
      success?: boolean;
      message?: string;
      email_verification_required?: boolean;
      session?: { access_token: string; refresh_token?: string } | null;
      user: any;
      profile: Profile;
    }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        role,
        full_name: fullName,
        company_name: companyName,
        email_redirect_to: redirectUrl,
      }),
    });
    if (data.session?.access_token) {
      localStorage.setItem('skillmatch_token', data.session.access_token);
    }
    return data;
  }

  async getDemoToken(userId: string) {
    const data = await this.request<{
      session: { access_token: string; expires_in: number };
      profile: Profile;
    }>('/auth/demo-token/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
    if (data.session?.access_token) {
      localStorage.setItem('skillmatch_token', data.session.access_token);
    }
    return data;
  }

  async getMe(): Promise<Profile> {
    return this.request<Profile>('/auth/me/');
  }

  async updatePassword(password: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/password/', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  logout() {
    localStorage.removeItem('skillmatch_token');
    localStorage.removeItem('skillmatch_user');
  }

  // --- PROFILES ---
  async getProfile(id: string): Promise<Profile> {
    return this.request<Profile>(`/profiles/${id}/`);
  }

  async updateProfile(id: string, data: Partial<Profile>): Promise<Profile> {
    return this.request<Profile>(`/profiles/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(formData: FormData): Promise<{ avatar_url: string; profile?: Profile }> {
    return this.request<{ avatar_url: string; profile?: Profile }>('/profiles/upload-avatar/', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadResume(formData: FormData): Promise<{ success: boolean; resume_url: string; filename?: string; profile?: Profile }> {
    return this.request<{ success: boolean; resume_url: string; filename?: string; profile?: Profile }>('/profiles/upload-resume/', {
      method: 'POST',
      body: formData,
    });
  }

  // --- JOBS & RECOMMENDATIONS ---
  async getJobs(params: Record<string, string> = {}): Promise<Job[]> {
    const query = new URLSearchParams(params).toString();
    const data = await this.request<any>(`/jobs/${query ? `?${query}` : ''}`);
    if (data && Array.isArray(data.results)) {
      return data.results;
    }
    return Array.isArray(data) ? data : [];
  }

  async getRecommendations(userId?: string, radius?: number | null): Promise<Job[]> {
    const params = new URLSearchParams();
    if (userId) params.set('user_id', userId);
    if (radius === null) params.set('all_india', 'true');
    else if (radius !== undefined) params.set('radius', String(radius));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Job[]>(`/jobs/recommendations/${query}`);
  }

  async getJobDetail(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/`);
  }

  async createJob(jobData: Partial<Job> & { employer_id: string }): Promise<Job> {
    return this.request<Job>('/jobs/', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(id: string, jobData: Partial<Job>): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/jobs/${id}/`, {
      method: 'DELETE',
    });
  }

  // --- APPLICATIONS & ATS ---
  async applyJob(jobId: string, applicantId: string, coverLetter?: string): Promise<Application> {
    return this.request<Application>('/applications/', {
      method: 'POST',
      body: JSON.stringify({
        job_id: jobId,
        applicant_id: applicantId,
        cover_letter: coverLetter,
      }),
    });
  }

  async getMyApplications(userId: string): Promise<Application[]> {
    return this.request<Application[]>(`/applications/?user_id=${userId}`);
  }

  async getEmployerApplicants(
    employerId: string,
    jobId?: string,
    status?: string
  ): Promise<Application[]> {
    const params = new URLSearchParams({ employer_id: employerId });
    if (jobId) params.append('job_id', jobId);
    if (status) params.append('status', status);
    return this.request<Application[]>(`/applications/employer/?${params.toString()}`);
  }

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus
  ): Promise<Application> {
    return this.request<Application>(`/applications/${applicationId}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async scheduleInterview(
    applicationId: string,
    details: { date: string; time: string; type: string; notes?: string }
  ): Promise<{ application: Application; message: Message }> {
    return this.request<{ application: Application; message: Message }>(
      `/applications/${applicationId}/schedule-interview/`,
      {
        method: 'POST',
        body: JSON.stringify(details),
      }
    );
  }

  // --- MESSAGES & CHAT ---
  async getApplicationMessages(applicationId: string): Promise<Message[]> {
    return this.request<Message[]>(`/messages/${applicationId}/`);
  }

  async sendMessage(
    applicationId: string,
    content: string,
    senderId: string
  ): Promise<Message> {
    return this.request<Message>(`/messages/${applicationId}/`, {
      method: 'POST',
      body: JSON.stringify({ content, sender_id: senderId }),
    });
  }

  async getChatInbox(userId: string): Promise<ChatConversation[]> {
    return this.request<ChatConversation[]>(`/chats/inbox/?user_id=${userId}`);
  }

  async getUnreadMessageCount(): Promise<number> {
    const data = await this.request<{ unread_count: number }>('/chats/unread-count/');
    return data.unread_count;
  }

  // --- SAVED & RECENTLY VIEWED ---
  async toggleSaveJob(jobId: string, userId: string, isSaved: boolean) {
    if (isSaved) {
      return this.request<{ saved: boolean; id?: string; job_id?: string }>(`/jobs/${jobId}/save/`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
    } else {
      return this.request<{ saved: boolean; job_id?: string }>(`/jobs/${jobId}/save/`, {
        method: 'DELETE',
        body: JSON.stringify({ user_id: userId }),
      });
    }
  }

  async getSavedJobs(userId: string): Promise<SavedJobItem[]> {
    const raw = await this.request<any[]>(`/saved-jobs/?user_id=${userId}`);
    return (raw || []).map((item) => {
      const resolvedJob = (typeof item.job === 'object' && item.job !== null) ? item.job : item.job_details;
      return {
        ...item,
        id: item.id || item.saved_job_id,
        job_id: item.job_id || resolvedJob?.id,
        user_id: item.user_id || item.user,
        job: resolvedJob,
      } as SavedJobItem;
    }).filter((item) => item.job && item.job.id);
  }

  async recordJobView(jobId: string, userId: string) {
    return this.request<{ recorded: boolean }>(`/jobs/${jobId}/record-view/`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async getRecentlyViewed(userId: string): Promise<RecentlyViewedItem[]> {
    return this.request<RecentlyViewedItem[]>(`/recently-viewed/?user_id=${userId}`);
  }

  // --- EMPLOYER ANALYTICS ---
  async getEmployerStats(employerId: string): Promise<EmployerStats> {
    return this.request<EmployerStats>(`/employer/stats/?employer_id=${employerId}`);
  }
}

export const api = new ApiService();
