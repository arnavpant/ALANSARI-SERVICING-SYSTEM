import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Search, Package, CheckCircle, TruckIcon, MapPin, AlertCircle, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function PartsReception() {
  const [searchTerm, setSearchTerm] = useState('')
  const [allResults, setAllResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingPart, setMarkingPart] = useState(null)

  // Normalize string - remove dashes, spaces, symbols for comparison
  const normalize = (str) => {
    if (!str) return ''
    return str.toString().replace(/[-\s_()]/g, '').toLowerCase()
  }

  // Load all pending parts on mount
  useEffect(() => {
    fetchAllPendingParts()
  }, [])

  // Fetch all jobs with pending parts
  const fetchAllPendingParts = async () => {
    setLoading(true)
    
    try {
      // Get all jobs that have status WAITING_FOR_PARTS or have any ORDERED parts
      const { data: jobsWithParts, error } = await supabase
        .from('jobs')
        .select('*, parts(*)')
        .or('status.eq.WAITING_FOR_PARTS,status.eq.IN_DIAGNOSIS')
        .neq('status', 'CLOSED')
        .order('date_received', { ascending: false })

      if (error) throw error

      // Filter to only jobs that have ORDERED parts
      const results = jobsWithParts
        .filter(job => job.parts && job.parts.some(p => p.status === 'ORDERED'))
        .map(job => ({
          job: job,
          parts: job.parts.filter(p => p.status === 'ORDERED')
        }))

      setAllResults(results)
    } catch (err) {
      console.error('Error fetching pending parts:', err)
      toast.error('Failed to load pending parts')
    } finally {
      setLoading(false)
    }
  }

  // Mark a part as ARRIVED
  const handleMarkArrived = async (part, job) => {
    setMarkingPart(part.id)

    try {
      // Update part status to ARRIVED
      const { error: partError } = await supabase
        .from('parts')
        .update({ 
          status: 'ARRIVED',
          date_arrived: new Date().toISOString()
        })
        .eq('id', part.id)

      if (partError) throw partError

      // Check if ALL parts for this job are now ARRIVED
      const { data: allParts, error: checkError } = await supabase
        .from('parts')
        .select('*')
        .eq('job_id', job.id)

      if (checkError) throw checkError

      const allArrived = allParts.every(p => p.status === 'ARRIVED' || p.status === 'INSTALLED')
      
      if (allArrived) {
        // All parts arrived - update job status to READY_FOR_REPAIR
        const { error: jobError } = await supabase
          .from('jobs')
          .update({ status: 'READY_FOR_REPAIR' })
          .eq('id', job.id)

        if (jobError) throw jobError

        toast.success(`All parts arrived! Job ${job.smart_job_id} is READY FOR REPAIR`, {
          duration: 5000,
          icon: '🎉'
        })
      } else {
        // Partial arrival
        const arrivedCount = allParts.filter(p => p.status === 'ARRIVED' || p.status === 'INSTALLED').length
        const totalCount = allParts.length
        toast.success(`Part marked as arrived (${arrivedCount}/${totalCount} received)`, {
          icon: '📦'
        })
      }

      // Refresh list
      fetchAllPendingParts()
    } catch (err) {
      console.error('Error marking part as arrived:', err)
      toast.error('Failed to update part status')
    } finally {
      setMarkingPart(null)
    }
  }

  // Filter results based on search term (client-side)
  const filteredResults = allResults.filter(({ job, parts }) => {
    if (!searchTerm.trim()) return true // Show all if no search

    const normalizedSearch = normalize(searchTerm)
    
    // Check job ID
    if (normalize(job.smart_job_id).includes(normalizedSearch)) return true
    
    // Check serial number
    if (normalize(job.serial_number).includes(normalizedSearch)) return true
    
    // Check tracking numbers
    if (parts.some(p => normalize(p.tracking_number).includes(normalizedSearch))) return true
    
    // Check part names
    if (parts.some(p => normalize(p.part_name).includes(normalizedSearch))) return true

    // Check invoice numbers
    if (parts.some(p => normalize(p.vendor_invoice_no).includes(normalizedSearch))) return true

    return false
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <TruckIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Parts Reception</h2>
            <p className="text-gray-600">All pending parts - search to filter by tracking number, job ID, or part name</p>
          </div>
        </div>

        {/* Search/Filter Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Filter by tracking number, Job ID, part name, invoice... (e.g., HP3001, 1Z999, LCD)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Clear filter"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredResults.length} job(s) with pending parts
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending parts...</p>
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="space-y-6">
          {filteredResults.map(({ job, parts }) => (
            <div key={job.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Job Header */}
              <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{job.smart_job_id}</h3>
                    <p className="text-sm text-gray-600">{job.brand} {job.device_type} - {job.serial_number}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <MapPin size={16} className="text-yellow-600" />
                      <span className="font-medium">Shelf: {job.shelf_location || 'Not Set'}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Waiting {formatDistanceToNow(new Date(job.date_received), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parts List */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">
                    Pending Parts ({parts.filter(p => p.status === 'ORDERED').length} waiting)
                  </h4>
                </div>

                <div className="space-y-3">
                  {parts.map(part => (
                    <div key={part.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        {/* Part Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <Package className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{part.part_name}</p>
                              {part.part_number && (
                                <p className="text-sm text-gray-600">P/N: {part.part_number}</p>
                              )}
                              {part.tracking_number && (
                                <div className="flex items-center gap-1 mt-1">
                                  <TruckIcon className="w-4 h-4 text-gray-400" />
                                  <p className="text-sm text-gray-600">{part.tracking_number}</p>
                                </div>
                              )}
                              {part.vendor_invoice_no && (
                                <p className="text-xs text-gray-500 mt-1">Invoice: {part.vendor_invoice_no}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div>
                          {part.status === 'ORDERED' ? (
                            <button
                              onClick={() => handleMarkArrived(part, job)}
                              disabled={markingPart === part.id}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {markingPart === part.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={18} />
                                  Mark Arrived
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium flex items-center gap-2">
                              <CheckCircle size={18} />
                              Arrived
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Reminder:</span> Place arrived parts in <span className="font-bold">Shelf {job.shelf_location || 'TBD'}</span> with the device.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm ? 'No Matching Parts' : 'No Pending Parts'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? `No parts match your filter "${searchTerm}"`
              : 'All parts have been received! 🎉'}
          </p>
        </div>
      )}
    </div>
  )
}
