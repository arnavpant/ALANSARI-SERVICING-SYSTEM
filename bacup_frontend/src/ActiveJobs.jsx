import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Edit2, MapPin, User, Calendar, Search, X, UserCheck, FileText, PackageCheck, AlertTriangle, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { generateDeliveryNote } from './utils/generateDeliveryNote'
import CloseJobModal from './CloseJobModal'

// --- SLA HELPER FUNCTION ---
const getSLAStatus = (job) => {
  const now = new Date().getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  // 1. GLOBAL BREACH (> 15 Days Old)
  const totalAge = (now - new Date(job.date_received).getTime()) / ONE_DAY;
  if (totalAge > 15) {
    return { 
      label: `15+ Days Open`, 
      // Bright Red Row
      rowClass: 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500', 
      badgeClass: 'text-red-700 bg-red-100 border-red-200', 
      icon: <AlertTriangle size={12} /> 
    };
  }

  // 2. PARTS DELAY (> 7 Days Waiting)
  if (job.status === 'WAITING_FOR_PARTS') {
    // We use updated_at to track when it entered this status
    // Fallback to date_received if updated_at is null
    const refDate = job.updated_at ? new Date(job.updated_at) : new Date(job.date_received);
    const waitingTime = (now - refDate.getTime()) / ONE_DAY;
    
    if (waitingTime > 7) {
      return { 
        label: `Parts Delayed (>7d)`, 
        // Orange Row
        rowClass: 'bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-500', 
        badgeClass: 'text-orange-700 bg-orange-100 border-orange-200', 
        icon: <Clock size={12} /> 
      };
    }
  }

  // 3. ASSIGNED STAGNATION (> 48 Hours)
  if (job.status === 'ASSIGNED' && job.date_assigned) {
    const assignedTime = (now - new Date(job.date_assigned).getTime()) / (ONE_DAY / 24); // Hours
    if (assignedTime > 48) {
      return { 
        label: `Stagnant (>48h)`, 
        // Purple Row
        rowClass: 'bg-purple-50 hover:bg-purple-100 border-l-4 border-purple-500', 
        badgeClass: 'text-purple-700 bg-purple-100 border-purple-200', 
        icon: <Clock size={12} /> 
      };
    }
  }

  return null;
}

export default function ActiveJobs({ onEdit }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [assigningJobId, setAssigningJobId] = useState(null)
  const [engineers, setEngineers] = useState([])
  const [closingJob, setClosingJob] = useState(null)

  // Generate Delivery Note
  const handleGenerateDeliveryNote = async (job) => {
    try {
      // Fetch parts for this job
      const { data: parts, error } = await supabase
        .from('parts')
        .select('*')
        .eq('job_id', job.id)
        .eq('status', 'INSTALLED')

      if (error) throw error

      const fileName = await generateDeliveryNote(job, parts || [])
      toast.success(`Delivery note generated: ${fileName}`)
    } catch (error) {
      console.error('Error generating delivery note:', error)
      toast.error('Failed to generate delivery note')
    }
  }

  // Fetch ACTIVE jobs (Not drafts, Not closed)
  const fetchActiveJobs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .neq('status', 'DRAFT_FROM_EMAIL')
      .neq('status', 'CLOSED')
      .order('date_received', { ascending: false })

    if (error) console.error('Error:', error)
    else setJobs(data || [])
    setLoading(false)
  }

  // Fetch Engineers from database
  const fetchEngineers = async () => {
    console.log('🔍 ActiveJobs: Fetching engineers...')
    const { data, error } = await supabase
      .from('engineers')
      .select('*')
      .eq('status', 'active')
      .order('id', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching engineers:', error)
      // Fallback to hardcoded if table doesn't exist yet
      setEngineers([
        { id: 'ENG1', name: 'Engineer 1' },
        { id: 'ENG2', name: 'Engineer 2' },
        { id: 'ENG3', name: 'Engineer 3' },
        { id: 'ENG4', name: 'Engineer 4' },
      ])
    } else {
      console.log('✅ Engineers fetched:', data)
      setEngineers(data || [])
    }
  }

  useEffect(() => {
    fetchActiveJobs()
    fetchEngineers()
  }, [])

  // Handle Engineer Assignment
  const handleAssignEngineer = async (jobId, engineerId, engineerName) => {
    if (!engineerId) return
    
    setAssigningJobId(jobId)
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          assigned_engineer_id: engineerId,
          status: 'ASSIGNED',
          date_assigned: new Date().toISOString()
        })
        .eq('id', jobId)
      
      if (error) {
        console.error('Assignment error:', error)
        toast.error('Failed to assign engineer. Check console.')
      } else {
        toast.success(`Job assigned to ${engineerName}`)
        fetchActiveJobs() // Refresh list
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('An error occurred during assignment')
    } finally {
      setAssigningJobId(null)
    }
  }

  // Filter jobs based on search term
  const filteredJobs = jobs.filter((job) => {
    if (!searchTerm) return true // Show all if no search term
    
    const search = searchTerm.toLowerCase()
    const serialNumber = (job.serial_number || '').toLowerCase()
    const retailerName = (job.retailer_name || '').toLowerCase()
    const smartJobId = (job.smart_job_id || '').toLowerCase()
    const brand = (job.brand || '').toLowerCase()
    const senderEmail = (job.sender_email || '').toLowerCase()
    
    return (
      serialNumber.includes(search) ||
      retailerName.includes(search) ||
      smartJobId.includes(search) ||
      brand.includes(search) ||
      senderEmail.includes(search)
    )
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-700">
              Shop Floor ({filteredJobs.length}{searchTerm && ` of ${jobs.length}`})
            </h3>
            <button onClick={fetchActiveJobs} className="text-sm text-blue-600 hover:underline">
              Refresh List
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Serial Number, Retailer, Job ID, Brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Job ID</th>
              <th className="p-4">Device & Shelf</th>
              <th className="p-4">Status & Assignment</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
               <tr><td colSpan="4" className="p-6 text-center text-slate-400">Loading...</td></tr>
            ) : filteredJobs.length === 0 ? (
               <tr><td colSpan="4" className="p-6 text-center text-slate-400">
                 {searchTerm ? `No jobs found matching "${searchTerm}"` : 'No active jobs found.'}
               </td></tr>
            ) : (
              filteredJobs.map((job) => {
                const sla = getSLAStatus(job); // Check for SLA status
                
                // Determine Row Styling
                // If SLA exists, use the rowClass. If not, use standard white background.
                // We add 'border-l-4 border-transparent' to normal rows so content stays aligned with colored rows.
                const rowClassName = sla 
                  ? sla.rowClass 
                  : "bg-white hover:bg-slate-50 border-l-4 border-transparent";

                return (
                  <tr key={job.id} className={`transition group ${rowClassName}`}>
                    {/* Job ID Column */}
                    <td className="p-4">
                      <span className="font-bold text-slate-800 text-lg">{job.smart_job_id}</span>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar size={12}/> {new Date(job.date_received).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Details Column */}
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{job.brand} {job.device_type}</div>
                      <div className="text-sm text-slate-500 mb-1">{job.serial_number}</div>
                      
                      {/* Shelf Location Badge */}
                      <div className="inline-flex items-center gap-1 bg-white/60 text-slate-700 px-2 py-0.5 rounded text-xs font-bold border border-slate-200 shadow-sm">
                        <MapPin size={12} /> {job.shelf_location || "No Shelf"}
                      </div>
                    </td>

                    {/* Status & Assignment Column */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm 
                          ${job.status === 'RECEIVED' ? 'bg-blue-100 text-blue-700' : 
                            job.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          {job.status}
                        </span>

                        {/* --- SLA WARNING BADGE --- */}
                        {sla && (
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border shadow-sm animate-pulse ${sla.badgeClass}`}>
                            {sla.icon} {sla.label}
                          </span>
                        )}
                      </div>
                      
                      {/* Engineer Assignment UI - Show for both RECEIVED and ASSIGNED */}
                      {(job.status === 'RECEIVED' || job.status === 'ASSIGNED') && (
                        <div className="mt-2 flex items-center gap-2">
                          {/* Current Engineer Display (if assigned) */}
                          {job.assigned_engineer_id && (
                            <div className="flex items-center gap-1 text-xs text-slate-600 mr-2">
                              <UserCheck size={12} className="text-purple-600" />
                              <span className="font-medium">{job.assigned_engineer_id || 'Unassigned'}</span>
                            </div>
                          )}
                          
                          {/* Dropdown to assign/reassign */}
                          <select
                            onChange={(e) => {
                              const selectedEngineer = engineers.find(eng => eng.id === e.target.value)
                              if (selectedEngineer) {
                                handleAssignEngineer(job.id, selectedEngineer.id, selectedEngineer.name)
                              }
                            }}
                            value=""
                            disabled={assigningJobId === job.id}
                            className="text-xs border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 outline-none bg-white/80"
                          >
                            <option value="">{job.assigned_engineer_id ? 'Reassign...' : 'Assign Engineer...'}</option>
                            {engineers.map(eng => (
                              <option key={eng.id} value={eng.id}>{eng.name}</option>
                            ))}
                          </select>
                          
                          {assigningJobId === job.id && (
                            <span className="text-xs text-slate-400">Saving...</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Close Job (only for COMPLETED jobs) */}
                        {job.status === 'COMPLETED' && (
                          <button 
                            onClick={() => setClosingJob(job)}
                            className="text-slate-400 hover:text-purple-600 transition p-2 hover:bg-purple-50 rounded-lg"
                            title="Close Job & Handover"
                          >
                            <PackageCheck size={18} />
                          </button>
                        )}
                        
                        {/* Generate Delivery Note (only for COMPLETED jobs) */}
                        {job.status === 'COMPLETED' && (
                          <button 
                            onClick={() => handleGenerateDeliveryNote(job)}
                            className="text-slate-400 hover:text-green-600 transition p-2 hover:bg-green-50 rounded-lg"
                            title="Generate Delivery Note"
                          >
                            <FileText size={18} />
                          </button>
                        )}
                        
                        {/* Edit Job */}
                        <button 
                          onClick={() => onEdit(job)} // <--- This triggers the modal in Edit Mode
                          className="text-slate-400 hover:text-blue-600 transition p-2 hover:bg-blue-50 rounded-lg"
                          title="Edit Job Details"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Close Job Modal */}
      {closingJob && (
        <CloseJobModal 
          job={closingJob}
          isOpen={!!closingJob}
          onClose={() => setClosingJob(null)}
          onClosed={() => {
            setClosingJob(null)
            fetchActiveJobs()
          }}
        />
      )}
    </div>
  )
}