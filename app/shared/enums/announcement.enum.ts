// Spec: employee-service AnnouncementDtos.ETab — dashboard tabs (ALL is a real backend value here)
export enum EAnnouncementTab {
  All = 'ALL',
  HighPriority = 'HIGH_PRIORITY',
  Featured = 'FEATURED',
  Upcoming = 'UPCOMING'
}

// Spec: EAnnouncementState — derived from the dates, shown next to the date range
export enum EAnnouncementState {
  Upcoming = 'UPCOMING',
  Active = 'ACTIVE',
  Expired = 'EXPIRED'
}

/** Announcements page layout, kept in ?view= (manual 6.3.5: List View / Dashboard View) */
export enum EAnnouncementView {
  List = 'LIST',
  Dashboard = 'DASHBOARD'
}
