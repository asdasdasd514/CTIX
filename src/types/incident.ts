export type IncidentCategory = 'street_light' | 'flooding' | 'waste' | 'road_damage' | 'other';

export type IncidentStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export type IncidentPriority = 'normal' | 'high' | 'urgent';

export type UserRole = 'citizen' | 'officer' | 'volunteer';

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
  officerName?: string;
  assignedAt: string;
  deadline: string;
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
  resolution?: IncidentResolution;
  rating?: IncidentRating;
  sameReportsCount: number; // Điểm cộng: số người cùng phản ánh (Upvote)
  verifiedByVolunteer?: boolean;
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
