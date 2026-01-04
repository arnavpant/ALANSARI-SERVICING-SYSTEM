import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Wrench, Package, MapPin, Calendar, AlertCircle, FileText, Plus, TruckIcon, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import DiagnosisForm from './DiagnosisForm'
import AddPartModal from './AddPartModal'
import CompletionModal from './CompletionModal'

export default function EngineerView({ user }) {
  const [myJobs, setMyJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [addPartJob, setAddPartJob] = useState(null)
  const [completionJob, setCompletionJob] = useState(null)
  const [jobParts, setJobParts] = useState({})
  const [selectedEngineerId, setSelectedEngineerId] = useState('') // For admin monitoring
  const [engineers, setEngineers] = useState([])

  // Determine which engineer ID to use
  const engineerId = user?.role === 'Engineer' 
    ? user?.linked_engineer_id 
    : selectedEngineerId; // Admin can select any engineer

  // Fetch engineers list (for admin dropdown)
  const fetchEngineers = async () => {
    console.log('🔍 EngineerView: Fetching engineers...')
    const { data, error } = await supabase
      .from('engineers')
      .select('*')
      .eq('status', 'active')
      .order('id', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching engineers:', error)
    } else {
      console.log('✅ Engineers fetched:', data)
      setEngineers(data || [])
    }
  }

  // Fetch jobs assigned to current engineer
  const fetchMyJobs = async () => {
    if (!engineerId) {
      setMyJobs([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('assigned_engineer_id', engineerId)
      .neq('status', 'CLOSED')
      .order('date_received', { ascending: false })

    if (error) {
      console.error('Error fetching my jobs:', error)
      setMyJobs([])
    } else {
      setMyJobs(data || [])
      // Fetch parts for each job
      if (data && data.length > 0) {
        fetchPartsForJobs(data.map(j => j.id))
      }
    }
    setLoading(false)
  }

  // Fetch parts for multiple jobs
  const fetchPartsForJobs = async (jobIds) => {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .in('job_id', jobIds)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching parts:', error)
    } else {
      // Group parts by job_id
      const grouped = {}
      data?.forEach(part => {
        if (!grouped[part.job_id]) grouped[part.job_id] = []
        grouped[part.job_id].push(part)
      })
      setJobParts(grouped)
    }
  }

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchEngineers()
    }
  }, [])

  useEffect(() => {
    fetchMyJobs()
  }, [engineerId])

  // Get status badge color
  const getStatusBadge = (status) => {
    const colors = {
      'ASSIGNED': 'bg-blue-100 text-blue-800',
      'IN_DIAGNOSIS': 'bg-purple-100 text-purple-800',
      'WAITING_FOR_PARTS': 'bg-yellow-100 text-yellow-800',
      'READY_FOR_REPAIR': 'bg-green-100 text-green-800',
      'IN_REPAIR': 'bg-orange-100 text-orange-800',
      'TESTING': 'bg-teal-100 text-teal-800',
      'COMPLETED': 'bg-emerald-100 text-emerald-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.role === 'Admin' ? 'Engineer Monitoring' : 'My Jobs'}
                </h1>
                <p className="text-gray-600">
                  {user?.role === 'Engineer' 
                    ? `Logged in as: ${user?.email}`
                    : 'View jobs assigned to engineers'}
                </p>
              </div>
            </div>

            {/* Admin Engineer Selector */}
            {user?.role === 'Admin' && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Monitor Engineer:</label>
                <select
                  value={selectedEngineerId}
                  onChange={(e) => setSelectedEngineerId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Engineer</option>
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.id}>{eng.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* No Engineer Linked (Engineers only) */}
        {user?.role === 'Engineer' && !engineerId && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Profile Not Linked</h3>
            <p className="text-gray-500">Your account is not linked to an engineer profile. Please contact administrator.</p>
          </div>
        )}

        {/* No Engineer Selected (Admin only) */}
        {user?.role === 'Admin' && !engineerId && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select an Engineer</h3>
            <p className="text-gray-500">Choose an engineer from the dropdown above to view their assigned jobs</p>
          </div>
        )}

        {/* Loading State */}
        {engineerId && loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your jobs...</p>
          </div>
        )}

        {/* No Jobs Found */}
        {engineerId && !loading && myJobs.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Assigned</h3>
            <p className="text-gray-500">
              {user?.role === 'Admin' 
                ? 'This engineer has no active jobs'
                : "You don't have any active jobs at the moment"}
            </p>
          </div>
        )}

        {/* Jobs List */}
        {engineerId && !loading && myJobs.length > 0 && (
          <div className="space-y-4">
            {myJobs.map(job => (
              <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {job.smart_job_id || 'No ID'}
                      </h3>
                      <p className="text-gray-600">
                        {job.brand} {job.device_type}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(job.status)}`}>
                      {job.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Serial:</span>
                      <span className="font-medium text-gray-900">{job.serial_number || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Shelf:</span>
                      <span className="font-medium text-gray-900">{job.shelf_location || 'Not Set'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Received:</span>
                      <span className="font-medium text-gray-900">
                        {job.date_received ? formatDistanceToNow(new Date(job.date_received), { addSuffix: true }) : 'Unknown'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Assigned:</span>
                      <span className="font-medium text-gray-900">
                        {job.date_assigned ? formatDistanceToNow(new Date(job.date_assigned), { addSuffix: true }) : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Fault Details */}
                  {job.fault_details && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Reported Issue:</p>
                          <p className="text-sm text-gray-600">{job.fault_details}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Technical Notes (if exists) */}
                  {job.technical_notes && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Technical Notes:</p>
                          <p className="text-sm text-blue-600 whitespace-pre-wrap">{job.technical_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parts List */}
                  {jobParts[job.id] && jobParts[job.id].length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Parts Ordered ({jobParts[job.id].length}):</p>
                      </div>
                      <div className="space-y-2">
                        {jobParts[job.id].map(part => (
                          <div key={part.id} className="bg-white rounded p-3 text-sm border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{part.part_name}</p>
                                {part.part_number && (
                                  <p className="text-xs text-gray-600">P/N: {part.part_number}</p>
                                )}
                                {part.tracking_number && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                                    <TruckIcon className="w-3 h-3" />
                                    {part.tracking_number}
                                  </div>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                part.status === 'ARRIVED' ? 'bg-green-100 text-green-800' :
                                part.status === 'ORDERED' ? 'bg-yellow-100 text-yellow-800' :
                                part.status === 'INSTALLED' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {part.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setSelectedJob(job)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <FileText size={18} />
                      {job.status === 'ASSIGNED' ? 'Start Diagnosis' : 'Update Diagnosis'}
                    </button>
                    <button 
                      onClick={() => setAddPartJob(job)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Add Part
                    </button>
                    
                    {/* Show Complete Job button for jobs that are ready */}
                    {(job.status === 'READY_FOR_REPAIR' || job.status === 'IN_REPAIR' || job.status === 'TESTING') && (
                      <button 
                        onClick={() => setCompletionJob(job)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Complete Job
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diagnosis Modal */}
      {selectedJob && (
        <DiagnosisForm 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
          onSave={fetchMyJobs}
        />
      )}

      {/* Add Part Modal */}
      {addPartJob && (
        <AddPartModal 
          job={addPartJob} 
          onClose={() => setAddPartJob(null)} 
          onSave={fetchMyJobs}
        />
      )}

      {/* Completion Modal */}
      {completionJob && (
        <CompletionModal 
          job={completionJob}
          isOpen={!!completionJob}
          onClose={() => setCompletionJob(null)}
          onComplete={fetchMyJobs}
        />
      )}
    </div>
  )
}
