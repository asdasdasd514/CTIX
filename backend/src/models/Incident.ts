import mongoose, { Schema, type Document } from 'mongoose';
import type { IncidentCategoryType } from './Unit';

export type IncidentStatusType =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type IncidentPriorityType = 'normal' | 'high' | 'urgent';

export interface IIncident extends Document {
  incidentId: string;
  code: string;
  title: string;
  description: string;
  category: IncidentCategoryType;
  status: IncidentStatusType;
  priority: IncidentPriorityType;
  location: {
    lat: number;
    lng: number;
    address: string;
    ward?: string;
    geo?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  sender: {
    name: string;
    phone: string;
  };
  photosBefore: string[];
  photosAfter: string[];
  assignedTo?: {
    unitName: string;
    officerName?: string;
    assigneeId?: string;
    assigneeName?: string;
    assignedAt: string;
    deadline: string;
    notes?: string;
  };
  assignmentHistory?: {
    changedAt: string;
    changedBy: string;
    reason: string;
    before: {
      unitName: string;
      assigneeName?: string;
      deadline: string;
      notes?: string;
      category: IncidentCategoryType;
      priority: IncidentPriorityType;
    };
    after: {
      unitName: string;
      assigneeName?: string;
      deadline: string;
      notes?: string;
      category: IncidentCategoryType;
      priority: IncidentPriorityType;
    };
  }[];
  resolution?: {
    notes: string;
    resolvedAt: string;
    officerName: string;
  };
  rating?: {
    stars: number;
    comment?: string;
    criteria: string[];
    ratedAt: string;
  };
  sameReportsCount: number;
  verifiedByVolunteer?: boolean;
  verificationNotes?: string;
  linkedReports?: {
    sender: { name: string; phone: string };
    photos: string[];
    reportedAt: string;
  }[];
  createdAtIso: string;
  updatedAtIso: string;
}

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['street_light', 'flooding', 'waste', 'road_damage', 'other'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
      ward: { type: String, default: 'Phường Trấn Biên' },
      geo: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          default: [106.8243, 10.9572],
        },
      },
    },
    sender: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    photosBefore: { type: [String], default: [] },
    photosAfter: { type: [String], default: [] },
    assignedTo: {
      type: {
        unitName: { type: String, required: true },
        officerName: String,
        assigneeId: String,
        assigneeName: String,
        assignedAt: { type: String, required: true },
        deadline: { type: String, required: true },
        notes: String,
      },
      default: undefined,
    },
    assignmentHistory: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    resolution: {
      type: {
        notes: { type: String, required: true },
        resolvedAt: { type: String, required: true },
        officerName: { type: String, required: true },
      },
      default: undefined,
    },
    rating: {
      type: {
        stars: { type: Number, min: 1, max: 5, required: true },
        comment: String,
        criteria: { type: [String], default: [] },
        ratedAt: { type: String, required: true },
      },
      default: undefined,
    },
    sameReportsCount: { type: Number, default: 1 },
    verifiedByVolunteer: { type: Boolean, default: false },
    verificationNotes: { type: String, default: undefined },
    linkedReports: {
      type: [
        {
          sender: { name: String, phone: String },
          photos: [String],
          reportedAt: String,
        },
      ],
      default: [],
    },
    createdAtIso: { type: String, required: true, index: true },
    updatedAtIso: { type: String, required: true },
  },
  { timestamps: false }
);

// GeoJSON 2dsphere index cho truy vấn bản đồ GIS (MOD-03)
IncidentSchema.index({ 'location.geo': '2dsphere' });

export function serializeIncident(doc: IIncident) {
  return {
    id: doc.incidentId,
    code: doc.code,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    status: doc.status,
    priority: doc.priority,
    location: {
      lat: doc.location.lat,
      lng: doc.location.lng,
      address: doc.location.address,
      ward: doc.location.ward,
    },
    sender: doc.sender,
    photosBefore: doc.photosBefore || [],
    photosAfter: doc.photosAfter && doc.photosAfter.length > 0 ? doc.photosAfter : undefined,
    assignedTo: doc.assignedTo || undefined,
    assignmentHistory:
      doc.assignmentHistory && doc.assignmentHistory.length > 0
        ? doc.assignmentHistory
        : undefined,
    resolution: doc.resolution || undefined,
    rating: doc.rating || undefined,
    sameReportsCount: doc.sameReportsCount ?? 1,
    verifiedByVolunteer: doc.verifiedByVolunteer || false,
    verificationNotes: doc.verificationNotes || undefined,
    linkedReports:
      doc.linkedReports && doc.linkedReports.length > 0 ? doc.linkedReports : undefined,
    createdAt: doc.createdAtIso,
    updatedAt: doc.updatedAtIso,
  };
}

export const IncidentModel = mongoose.model<IIncident>('Incident', IncidentSchema);
