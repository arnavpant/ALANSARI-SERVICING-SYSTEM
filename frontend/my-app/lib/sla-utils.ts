import type { Job, SLAData } from "./types"

const ONE_DAY = 24 * 60 * 60 * 1000

export function getSLAData(allJobs: Job[]): SLAData {
  const now = new Date().getTime()

  const data: SLAData = {
    overdueDrafts: [],
    stagnantJobs: [],
    partsDelay: [],
    slaBreach: [],
    totalCount: 0,
  }

  allJobs.forEach((job) => {
    const dateReceived = new Date(job.date_received).getTime()
    const ageInDays = (now - dateReceived) / ONE_DAY

    // 1. DRAFT CHECK (> 24 Hours)
    if (job.status === "DRAFT_FROM_EMAIL") {
      if (now - dateReceived > ONE_DAY) {
        data.overdueDrafts.push(job)
      }
    }
    // ACTIVE JOB CHECKS
    else if (job.status !== "CLOSED") {
      // 2. GLOBAL BREACH (> 15 Days)
      if (ageInDays > 15) {
        data.slaBreach.push(job)
      }

      // 3. ASSIGNED STAGNATION (> 48 Hours)
      if (job.status === "ASSIGNED" && job.date_assigned) {
        const assignedTime = new Date(job.date_assigned).getTime()
        if (now - assignedTime > 2 * ONE_DAY) {
          data.stagnantJobs.push(job)
        }
      }

      // 4. PARTS DELAY (> 7 Days)
      if (job.status === "WAITING_FOR_PARTS") {
        const refDate = job.updated_at ? new Date(job.updated_at) : new Date(job.date_received)
        if (now - refDate.getTime() > 7 * ONE_DAY) {
          data.partsDelay.push(job)
        }
      }
    }
  })

  data.totalCount =
    data.overdueDrafts.length + data.stagnantJobs.length + data.partsDelay.length + data.slaBreach.length
  return data
}

export function getJobSLAStatus(job: Job) {
  const now = new Date().getTime()

  // 1. GLOBAL BREACH (> 15 Days Old)
  const totalAge = (now - new Date(job.date_received).getTime()) / ONE_DAY
  if (totalAge > 15) {
    return {
      label: "15+ Days Open",
      variant: "destructive" as const,
      className: "bg-red-50 border-l-4 border-red-500",
    }
  }

  // 2. PARTS DELAY (> 7 Days Waiting)
  if (job.status === "WAITING_FOR_PARTS") {
    const refDate = job.updated_at ? new Date(job.updated_at) : new Date(job.date_received)
    const waitingTime = (now - refDate.getTime()) / ONE_DAY

    if (waitingTime > 7) {
      return {
        label: "Parts Delayed (>7d)",
        variant: "warning" as const,
        className: "bg-orange-50 border-l-4 border-orange-500",
      }
    }
  }

  // 3. ASSIGNED STAGNATION (> 48 Hours)
  if (job.status === "ASSIGNED" && job.date_assigned) {
    const assignedHours = (now - new Date(job.date_assigned).getTime()) / (ONE_DAY / 24)
    if (assignedHours > 48) {
      return {
        label: "Stagnant (>48h)",
        variant: "secondary" as const,
        className: "bg-purple-50 border-l-4 border-purple-500",
      }
    }
  }

  return null
}
