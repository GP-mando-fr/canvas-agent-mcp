/**
 * Universal Canvas LMS REST API Client
 */

export interface CanvasConfig {
  baseUrl: string;
  apiToken: string;
}

export class CanvasClient {
  private baseUrl: string;
  private token: string;

  constructor(config?: Partial<CanvasConfig>) {
    const baseUrl = config?.baseUrl || process.env.CANVAS_BASE_URL;
    const token = config?.apiToken || process.env.CANVAS_API_TOKEN;

    if (!baseUrl) {
      throw new Error("CANVAS_BASE_URL is required. Set it in your environment or pass it to constructor.");
    }
    if (!token) {
      throw new Error("CANVAS_API_TOKEN is required. Set it in your environment or pass it to constructor.");
    }

    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}/api/v1${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const errorText = await res.text();
      let errorJson: any = null;
      try { errorJson = JSON.parse(errorText); } catch {}
      const msg = errorJson?.errors?.[0]?.message || errorJson?.message || errorText;
      throw new Error(`Canvas API Error [${res.status}]: ${msg}`);
    }

    return (await res.json()) as T;
  }

  // --- Courses ---
  async searchCourses(query?: string, perPage = 25) {
    const params = new URLSearchParams({ per_page: String(perPage) });
    if (query) params.append("search_term", query);
    return this.request(`/courses?${params.toString()}`);
  }

  async getCourse(courseId: number | string) {
    return this.request(`/courses/${courseId}?include[]=term&include[]=total_students`);
  }

  async duplicateCourse(sourceCourseId: number | string, options: {
    newName: string;
    newCode?: string;
    startDate?: string;
    endDate?: string;
  }) {
    // 1. Create target course
    const newCourse = await this.request(`/accounts/1/courses`, {
      method: "POST",
      body: JSON.stringify({
        course: {
          name: options.newName,
          course_code: options.newCode || options.newName,
          start_at: options.startDate,
          end_at: options.endDate,
        },
      }),
    });

    // 2. Start content migration
    const migration = await this.request(`/courses/${newCourse.id}/content_migrations`, {
      method: "POST",
      body: JSON.stringify({
        migration_type: "course_copy_importer",
        settings: {
          source_course_id: sourceCourseId,
        },
      }),
    });
    return {
      new_course_id: newCourse.id,
      new_course_name: newCourse.name,
      migration_id: migration.id,
      status: migration.workflow_state,
    };
  }

  async getMigrationStatus(courseId: number | string, migrationId: number | string) {
    return this.request(`/courses/${courseId}/content_migrations/${migrationId}`);
  }

  async setMissingSubmissionPolicy(courseId: number | string, deductionPercentage = 100) {
    return this.request(`/courses/${courseId}/late_policy`, {
      method: "POST",
      body: JSON.stringify({
        late_policy: {
          missing_submission_deduction_enabled: true,
          missing_submission_deduction: deductionPercentage,
        },
      }),
    });
  }

  // --- Assignments & Due Dates ---
  async listAssignments(courseId: number | string) {
    return this.request(`/courses/${courseId}/assignments?per_page=100&include[]=overrides`);
  }

  async updateAssignmentDueDate(courseId: number | string, assignmentId: number | string, dueAt: string) {
    return this.request(`/courses/${courseId}/assignments/${assignmentId}`, {
      method: "PUT\",
      body: JSON.stringify({
        assignment: { due_at: dueAt },
      }),
    });
  }

  async setStudentDueDate(courseId: number | string, assignmentId: number | string, studentId: number | string, dueAt: string) {
    return this.request(`/courses/${courseId}/assignments/${assignmentId}/overrides`, {
      method: "POST",
      body: JSON.stringify({
        assignment_override: {
          student_ids: [Number(studentId)],
          due_at: dueAt,
          title: `Extension for student #${studentId}`,
        },
      }),
    });
  }

  async removeStudentDueDate(courseId: number | string, assignmentId: number | string, overrideId: number | string) {
    return this.request(`/courses/${courseId}/assignments/${assignmentId}/overrides/${overrideId}`, {
      method: "DELETE",
    });
  }

  // --- Announcements ---
  async listAnnouncements(courseId: number | string) {
    return this.request(`/courses/${courseId}/discussion_topics?only_announcements=true&per_page=50`);
  }

  async createAnnouncement(courseId: number | string, options: {
    title: string;
    message: string;
    delayedPostAt?: string | null;
  }) {
    return this.request(`/courses/${courseId}/discussion_topics`, {
      method: "POST",
      body: JSON.stringify({
        title: options.title,
        message: options.message,
        is_announcement: true,
        delayed_post_at: options.delayedPostAt || null,
      }),
    });
  }

  async deleteAnnouncement(courseId: number | string, topicId: number | string) {
    return this.request(`/courses/${courseId}/discussion_topics/${topicId}`, {
      method: "DELETE",
    });
  }

  // --- Calendar & Live Sessions ---
  async listCalendarEvents(courseId: number | string) {
    return this.request(`/calendar_events?context_codes[]=course_${courseId}&per_page=50`);
  }

  async createCalendarEvent(options: {
    courseId: number | string;
    title: string;
    startAt: string;
    endAt?: string;
    description?: string;
    locationName?: string;
  }) {
    return this.request(`/calendar_events`, {
      method: "POST",
      body: JSON.stringify({
        calendar_event: {
          context_code: `course_${options.courseId}`,
          title: options.title,
          start_at: options.startAt,
          end_at: options.endAt || options.startAt,
          description: options.description || "",
          location_name: options.locationName || "Online Meeting",
        },
      }),
    });
  }

  // --- Students & Invitations ---
  async listCourseStudents(courseId: number | string) {
    return this.request(`/courses/${courseId}/enrollments?type[]=StudentEnrollment&per_page=100&include[]=user`);
  }

  async listPendingInvitations(courseId: number | string) {
    const enrollments = await this.listCourseStudents(courseId);
    return (enrollments || []).filter((e: any) => e.enrollment_state === "invited");
  }

  // --- Audit Submission ---
  async auditSubmission(courseId: number | string, assignmentId: number | string, studentId: number | string) {
    return this.request(`/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}?include[]=submission_history&include[]=rubric_assessment`);
  }
}
