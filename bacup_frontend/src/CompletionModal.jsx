import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { X, CheckCircle, Package, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CompletionModal({ job, isOpen, onClose, onComplete }) {
  const [parts, setParts] = useState([])
  const [oldPartsData, setOldPartsData] = useState({}) // Track old part details
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (isOpen && job) {
      fetchParts()
    }
  }, [isOpen, job])

  const fetchParts = async () => {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .eq('job_id', job.id)
      .eq('status', 'ARRIVED')

    if (error) {
      console.error('Error fetching parts:', error)
      toast.error('Failed to load parts')
    } else {
      setParts(data || [])
      // Initialize old parts data for each new part
      const initialData = {}
      data?.forEach(part => {
        initialData[part.id] = {
          oldPartSerial: '',
          rmaStatus: '' // SCRAP or RMA_PENDING
        }
      })
      setOldPartsData(initialData)
    }
  }

  const handleOldPartChange = (partId, field, value) => {
    setOldPartsData(prev => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        [field]: value
      }
    }))
    setValidationError('')
  }

  const handleComplete = async () => {
    // Validation: Check if all old parts have RMA status and serial number
    const incompleteParts = parts.filter(part => {
      const oldData = oldPartsData[part.id]
      return !oldData?.rmaStatus || !oldData?.oldPartSerial?.trim()
    })
    
    if (incompleteParts.length > 0) {
      setValidationError(`Please fill in old part details (serial + RMA status) for all ${parts.length} installed parts`)
      return
    }

    setLoading(true)

    try {
      // Step 1: Mark all NEW parts as INSTALLED
      for (const part of parts) {
        const { error: partError } = await supabase
          .from('parts')
          .update({ status: 'INSTALLED' })
          .eq('id', part.id)

        if (partError) throw partError
      }

      // Step 2: Insert OLD parts into separate old_parts table
      for (const part of parts) {
        const oldData = oldPartsData[part.id]
        const { error: oldPartError } = await supabase
          .from('old_parts')
          .insert({
            job_id: job.id,
            part_id: part.id, // Link to new part
            old_part_serial: oldData.oldPartSerial,
            part_type: part.part_name, // Copy part name
            part_number: part.part_number, // Copy P/N
            rma_status: oldData.rmaStatus,
            removed_at: new Date().toISOString()
          })

        if (oldPartError) throw oldPartError
      }

      // Step 3: Update job status to COMPLETED
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ 
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      if (jobError) throw jobError

      toast.success('Job marked as completed!')
      onComplete()
      onClose()
    } catch (error) {
      console.error('Error completing job:', error)
      toast.error('Failed to complete job')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Complete Repair Job</h2>
              <p className="text-sm text-gray-600">Job ID: {job?.smart_job_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Old Part Details Required</h3>
              <p className="text-sm text-blue-800">
                For each NEW part you installed, provide details about the OLD/BROKEN part you removed:
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li><strong>Serial Number:</strong> Serial/ID of the old broken part</li>
                <li><strong>Scrap/Discard:</strong> Old part cannot be returned</li>
                <li><strong>Return to Vendor (RMA):</strong> Old part eligible for warranty return</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Parts List */}
        {parts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No parts found for this job</p>
            <p className="text-sm">This job may not have required any parts</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900">
              New Parts Installed ({parts.length})
            </h3>
            
            {parts.map((part, index) => {
              const oldData = oldPartsData[part.id] || {}
              
              return (
                <div 
                  key={part.id} 
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">New Part {index + 1}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          INSTALLED
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mt-1">{part.part_name}</h4>
                      <p className="text-sm text-gray-600">P/N: {part.part_number}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-300 my-3"></div>

                  {/* Old Part Details */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700">Old/Broken Part Removed:</h5>
                    
                    {/* Old Part Serial Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Serial Number / ID of Old Part: *
                      </label>
                      <input
                        type="text"
                        value={oldData.oldPartSerial || ''}
                        onChange={(e) => handleOldPartChange(part.id, 'oldPartSerial', e.target.value)}
                        placeholder="Enter serial number of removed part"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* RMA Selection for Old Part */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What to do with old part: *
                      </label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`rma-${part.id}`}
                            value="SCRAP"
                            checked={oldData.rmaStatus === 'SCRAP'}
                            onChange={(e) => handleOldPartChange(part.id, 'rmaStatus', e.target.value)}
                            className="w-4 h-4 text-red-600"
                          />
                          <span className="text-sm">
                            <span className="font-medium">Scrap/Discard</span>
                            <span className="text-gray-500 block text-xs">Cannot return</span>
                          </span>
                        </label>
                        
                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`rma-${part.id}`}
                            value="RMA_PENDING"
                            checked={oldData.rmaStatus === 'RMA_PENDING'}
                            onChange={(e) => handleOldPartChange(part.id, 'rmaStatus', e.target.value)}
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm">
                            <span className="font-medium">Return to Vendor (RMA)</span>
                            <span className="text-gray-500 block text-xs">Warranty return</span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{validationError}</p>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={loading || parts.length === 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Completing...' : 'Complete Job'}
          </button>
        </div>
      </div>
    </div>
  )
}
