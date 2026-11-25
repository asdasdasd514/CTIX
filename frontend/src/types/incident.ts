export type IncidentCategory =
  | "street_light"
  | "flooding"
  | "waste"
  | "road_damage"
  | "other";

export type IncidentStatus =
  | "pending_review"
  | "pending"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "rejected";

export type IncidentPriority = "normal" | "high" | "urgent";

export type UserRole = "citizen" | "officer" | "volunteer";

export interface IncidentLocation {
  lat: number;
  lng: number;
  address: string;
  ward?: string;
}

export interface IncidentSender {
  name: string;
  phone: string;
}

export interface IncidentAssignment {
  unitName: string;
  /** Người phân công (cán bộ tiếp nhận/điều phối) */
  officerName?: string;
  /** Cán bộ phụ trách thực hiện trong đơn vị (tùy chọn) */
  assigneeId?: string;
  assigneeName?: string;
  assignedAt: string;
  deadline: string;
  notes?: string;
}

export interface AssignmentSnapshot {
  unitName: string;
  assigneeName?: string;
  deadline: string;
  notes?: string;
  category: IncidentCategory;
  priority: IncidentPriority;
}

export interface AssignmentChangeRecord {
  changedAt: string;
  changedBy: string;
  reason: string;
  before: AssignmentSnapshot;
  after: AssignmentSnapshot;
}

export interface IncidentResolution {
  notes: string;
  resolvedAt: string;
  officerName: string;
}

export interface IncidentRating {
  stars: number;
  comment?: string;
  criteria: string[];
  ratedAt: string;
}

export interface IncidentReview {
  decision: "approved" | "rejected";
  reviewedAt: string;
  reviewedBy: string;
  reason?: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface Incident {
  id: string;
  code: string; // vd: TB-2026-001
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  priority: IncidentPriority;
  location: IncidentLocation;
  sender: IncidentSender;
  photosBefore: string[];
  photosAfter?: string[];
  assignedTo?: IncidentAssignment;
  assignmentHistory?: AssignmentChangeRecord[];
  resolution?: IncidentResolution;
  rating?: IncidentRating;
  sameReportsCount: number; // Điểm cộng: số người cùng phản ánh (Upvote)
  verifiedByVolunteer?: boolean;
  verificationNotes?: string;
  linkedReports?: {
    sender: IncidentSender;
    photos: string[];
    reportedAt: string;
  }[];
  workflowSteps?: WorkflowStep[];
  review?: IncidentReview;
  createdAt: string;
  updatedAt: string;
}

export interface NewIncidentInput {
  title?: string;
  description: string;
  category: IncidentCategory;
  location: IncidentLocation;
  senderPhone: string;
  senderName?: string;
  photosBefore: string[];
  duplicateOf?: string;
  status?: IncidentStatus;
}

export interface CategoryInfo {
  id: IncidentCategory;
  name: string;
  iconName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
}
