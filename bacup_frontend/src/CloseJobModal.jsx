import { useState } from 'react'
import { supabase } from './supabase'
import { X, PackageCheck, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CloseJobModal({ job, isOpen, onClose, onClosed }) {
  const [loading, setLoading] = useState(false)

  const handleCloseJob = async () => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'CLOSED',
          closed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      if (error) throw error

      toast.success(`Job ${job.smart_job_id} closed successfully!`)
      onClosed()
      onClose()
    } catch (error) {
      console.error('Error closing job:', error)
      toast.error('Failed to close job')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <PackageCheck className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Close Job & Handover</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Final Step: Handover Confirmation</h3>
              <p className="text-sm text-amber-800">
                This action marks the job as <strong>CLOSED</strong> and locks the record. 
                Only proceed if:
              </p>
              <ul className="text-sm text-amber-800 mt-2 ml-4 list-disc space-y-1">
                <li>Device has been repaired and tested</li>
                <li>Delivery note has been generated</li>
                <li>Device is being handed over to customer/courier</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Job Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Job Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Job ID:</span>
              <span className="font-medium">{job.smart_job_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Retailer:</span>
              <span className="font-medium">{job.retailer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Device:</span>
              <span className="font-medium">{job.brand} {job.device_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Serial:</span>
              <span className="font-medium">{job.serial_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCloseJob}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Closing...' : 'Confirm Handover & Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
