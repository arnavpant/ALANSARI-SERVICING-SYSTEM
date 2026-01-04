import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { FileText, Package, RefreshCw, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { generateDeliveryNote } from './utils/generateDeliveryNote'

export default function ClosedJobs() {
  const [closedJobs, setClosedJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClosedJobs()
  }, [])

  const fetchClosedJobs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'CLOSED')
        .order('closed_at', { ascending: false })
      
      if (error) throw error
      setClosedJobs(data || [])
    } catch (error) {
      console.error('Error fetching closed jobs:', error)
      toast.error('Failed to load closed jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDeliveryNote = async (job) => {
    try {
      // Fetch installed parts for this job
      const { data: parts, error } = await supabase
        .from('parts')
        .select('*')
        .eq('job_id', job.id)
        .eq('status', 'INSTALLED')
      
      if (error) throw error
      
      // Generate PDF
      generateDeliveryNote(job, parts || [])
      toast.success('Delivery note opened in new tab')
    } catch (error) {
      console.error('Error generating delivery note:', error)
      toast.error('Failed to generate delivery note')
    }
  }

  const filteredJobs = closedJobs.filter(job => 
    job.smart_job_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.retailer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-700">Closed Jobs</h3>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
              {filteredJobs.length} jobs
            </span>
          </div>
          <button
            onClick={fetchClosedJobs}
            disabled={loading}
            className="text-sm flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Job ID, Retailer, or Serial Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Job ID</th>
              <th className="p-4">Retailer</th>
              <th className="p-4">Device</th>
              <th className="p-4">Serial Number</th>
              <th className="p-4">Closed Date</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    Loading closed jobs...
                  </div>
                </td>
              </tr>
            ) : filteredJobs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  {searchTerm ? 'No matching closed jobs found' : 'No closed jobs yet'}
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <span className="font-mono font-semibold text-blue-600">
                      {job.smart_job_id || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{job.retailer_name}</div>
                    <div className="text-xs text-slate-400">{job.retailer_ref}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-700">{job.brand} {job.device_type}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs text-slate-600">{job.serial_number}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-700">
                      {job.closed_at ? new Date(job.closed_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {job.closed_at ? formatDistanceToNow(new Date(job.closed_at)) + ' ago' : ''}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Generate Delivery Note Button */}
                      <button
                        onClick={() => handleGenerateDeliveryNote(job)}
                        title="Generate Delivery Note"
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
