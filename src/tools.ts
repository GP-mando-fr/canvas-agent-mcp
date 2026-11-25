import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CanvasClient } from "./canvas.js";

export function registerTools(server: McpServer, canvas: CanvasClient) {
  // Search Courses
  server.tool(
    "canvas_search_courses",
    "Search Canvas courses by name or code",
    {
      query: z.string().optional().describe("Course search term"),
      limit: z.number().optional().default(25).describe("Max courses"),
    },
    async ({ query, limit }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.searchCourses(query, limit), null, 2) }],
    })
  );

  // Get Course
  server.tool(
    "canvas_get_course",
    "Get detailed information about a Canvas course by ID",
    { course_id: z.number().describe("Course ID") },
    async ({ course_id }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.getCourse(course_id), null, 2) }],
    })
  );

  // Duplicate Course
  server.tool(
    "canvas_duplicate_course",
    "Duplicate an existing Canvas course into a new shell using Content Migrations API",
    {
      source_course_id: z.number().describe("Source course ID"),
      new_name: z.string().describe("New course name"),
      new_code: z.string().optional().describe("New course code"),
      start_date: z.string().optional().describe("ISO 8601 start date"),
      end_date: z.string().optional().describe("ISO 8601 end date"),
    },
    async (opts) => ({
      content: [{
        type: "text",
        text: JSON.stringify(await canvas.duplicateCourse(opts.source_course_id, {
          newName: opts.new_name,
          newCode: opts.new_code,
          startDate: opts.start_date,
          endDate: opts.end_date,
        }), null, 2),
      }],
    })
  );

  // Duplicate Status
  server.tool(
    "canvas_get_duplicate_status",
    "Check progress of a course duplication migration job",
    {
      course_id: z.number().describe("Course ID"),
      migration_id: z.number().describe("Migration ID"),
    },
    async ({ course_id, migration_id }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.getMigrationStatus(course_id, migration_id), null, 2) }],
    })
  );

  // Missing Submission Policy
  server.tool(
    "canvas_set_missing_submission_policy",
    "Set missing submission deduction percentage (default 100 for 0%)",
    {
      course_id: z.number().describe("Course ID"),
      deduction_percentage: z.number().optional().default(100).describe("Deduction percentage"),
    },
    async ({ course_id, deduction_percentage }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.setMissingSubmissionPolicy(course_id, deduction_percentage), null, 2) }],
    })
  );

  // Assignments
  server.tool(
    "canvas_list_assignments",
    "List course assignments with due dates and overrides",
    { course_id: z.number().describe("Course ID") },
    async ({ course_id }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.listAssignments(course_id), null, 2) }],
    })
  );

  // Update Due Date
  server.tool(
    "canvas_update_assignment_due_date",
    "Update the main due date of an assignment",
    {
      course_id: z.number().describe("Course ID"),
      assignment_id: z.number().describe("Assignment ID"),
      due_at: z.string().describe("ISO 8601 due date"),
    },
    async ({ course_id, assignment_id, due_at }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.updateAssignmentDueDate(course_id, assignment_id, due_at), null, 2) }],
    })
  );

  // Student Due Date Override
  server.tool(
    "canvas_set_student_due_date",
    "Give an individual student a personal due date extension (Assignment Override)",
    {
      course_id: z.number().describe("Canvas Course ID"),
      assignment_id: z.number().describe("Assignment ID"),
      student_id: z.number().describe("Student ID"),
      due_at: z.string().describe("New extended due date"),
    },
    async ({ course_id, assignment_id, student_id, due_at }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.setStudentDueDate(course_id, assignment_id, student_id, due_at), null, 2) }],
    })
  );

  server.tool(
    "canvas_remove_student_due_date",
    "Remove an individual student's due date override",
    {
      course_id: z.number().describe("Course ID"),
      assignment_id: z.number().describe("Assignment ID"),
      override_id: z.number().describe("Override ID to delete"),
    },
    async ({ course_id, assignment_id, override_id }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.removeStudentDueDate(course_id, assignment_id, override_id), null, 2) }],
    })
  );

  // Announcements
  server.tool(
    "canvas_list_announcements",
    "List announcements of a course",
    { course_id: z.number().describe("Course ID") },
    async ({ course_id }) => {
      content: [{ type: "text", text: JSON.stringify(await canvas.listAnnouncements(course_id), null, 2) }],
    })
  );

  server.tool(
    "canvas_create_announcement",
    "Publish or schedule an announcement",
    {
      course_id: z.number().describe("Course ID"),
      title: z.string().describe("Announcement title"),
      message: z.string().describe("Announcement body (HTML or plain text)"),
      delayed_post_at: z.string().optional().describe("ISO 8601 publish date (optional)"),
    },
    async ({ course_id, title, message, delayed_post_at }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.createAnnouncement(course_id, { title, message, delayedPostAt: delayed_post_at }), null, 2) }],
    })
  );

  // Calendar
  server.tool(
    "canvas_list_calendar_events",
    "List course calendar events and live sessions",
    { course_id: z.number().describe("Course ID") },
    async ({ course_id }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.listCalendarEvents(course_id), null, 2) }],
    })
  );

  server.tool(
    "canvas_create_calendar_event",
    "Create a calendar event with meeting link (Live Class, Webinar)",
    {
      course_id: z.number().describe("Course ID"),
      title: z.string().describe("Event title"),
      start_at: z.string().describe("ISO 8601 start time"),
      end_at: z.string().optional().describe("ISO 8601 end time"),
      description: z.string().optional().describe("Event description and links"),
      location_name: z.string().optional().describe("Location name"),
    },
    async (opts) => ({
      content: [{
        type: "text",
        text: JSON.stringify(await canvas.createCalendarEvent({
          courseId: opts.course_id,
          title: opts.title,
          startAt: opts.start_at,
          endAt: opts.end_at,
          description: opts.description,
          locationName: opts.location_name,
        }), null, 2),
      }],
    })
  );

  // Students & Invitations
  server.tool(
    "canvas_list_students",
    "List enrolled students with state (active, invited, completed) and last activity",
    { course_id: z.number().describe("Course ID") },
    async ({ course_id }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.listCourseStudents(course_id), null, 2) }],
    })
  );

  server.tool(
    "canvas_list_pending_invitations",
    "List students who have not yet accepted their course invitation",
    { course_id: z.number().describe("Course ID") },
    async ({ course_id }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.listPendingInvitations(course_id), null, 2) }],
    })
  );

  // Audit Submission
  server.tool(
    "canvas_audit_submission",
    "Forensic audit of a student submission (attempts, timestamps, duration, scores)",
    {
      course_id: z.number().describe("Course ID"),
      assignment_id: z.number().describe("Assignment ID"),
      student_id: z.number().describe("Student ID"),
    },
    async ({ course_id, assignment_id, student_id }) => ({
      content: [{ type: "text", text: JSON.stringify(await canvas.auditSubmission(course_id, assignment_id, student_id), null, 2) }],
    })
  );
}
