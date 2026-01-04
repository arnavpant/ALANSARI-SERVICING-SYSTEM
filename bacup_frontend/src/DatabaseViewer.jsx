import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { generateYearlyArchive } from './utils/exportArchive' // <--- IMPORT THIS
import { 
  Database, Search, Plus, Trash2, Edit2, Save, X, 
  ChevronUp, ChevronDown, Eye, EyeOff, 
  FileSpreadsheet, AlertTriangle, Download // <--- ADDED NEW ICONS
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function DatabaseViewer() {
  const [selectedTable, setSelectedTable] = useState('jobs')
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [hiddenTables, setHiddenTables] = useState(['auth.users'])
  
  // NEW STATE FOR ARCHIVING
  const [isArchiving, setIsArchiving] = useState(false)

  const availableTables = [
    { name: 'jobs', label: 'Jobs', icon: '📋' },
    { name: 'parts', label: 'Parts (New)', icon: '🔧' },
    { name: 'old_parts', label: 'Old Parts (RMA)', icon: '♻️' },
    { name: 'engineers', label: 'Engineers', icon: '👷' },
    { name: 'users', label: 'Users', icon: '👤' },
  ]

  useEffect(() => {
    if (selectedTable) {
      fetchTableData()
    }
  }, [selectedTable, sortColumn, sortDirection])

  // --- NEW ARCHIVE HANDLER ---
  const handleArchive = async () => {
    if(!window.confirm("This will download the full database as a single Excel file. Continue?")) return;
    
    setIsArchiving(true);
    const result = await generateYearlyArchive();
    
    if (result.success) {
      toast.success(`Export Complete! Processed ${result.count} jobs.`);
    } else {
      toast.error("Export failed. Check console for details.");
    }
    setIsArchiving(false);
  }

  const fetchTableData = async () => {
    setLoading(true)
    try {
      let query = supabase.from(selectedTable).select('*')

      if (sortColumn) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc' })
      }

      const { data: tableData, error } = await query

      if (error) throw error

      setData(tableData || [])
      
      if (tableData && tableData.length > 0) {
        setColumns(Object.keys(tableData[0]))
      } else {
        setColumns([])
      }
    } catch (error) {
      console.error('Error fetching table data:', error)
      toast.error(`Failed to load ${selectedTable}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleCellEdit = (rowId, column, currentValue) => {
    setEditingCell({ rowId, column })
    setEditValue(currentValue)
  }

  const handleSaveCell = async (rowId, column) => {
    try {
      const { error } = await supabase
        .from(selectedTable)
        .update({ [column]: editValue })
        .eq('id', rowId)

      if (error) throw error

      toast.success('Updated successfully')
      fetchTableData()
      setEditingCell(null)
    } catch (error) {
      console.error('Error updating cell:', error)
      toast.error('Failed to update')
    }
  }

  const handleDeleteRow = async (rowId) => {
    if (!confirm('Are you sure you want to delete this row?')) return

    try {
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .eq('id', rowId)

      if (error) throw error

      toast.success('Row deleted successfully')
      fetchTableData()
    } catch (error) {
      console.error('Error deleting row:', error)
      toast.error('Failed to delete row')
    }
  }

  const handleAddRow = async () => {
    const newRow = {}
    columns.forEach(col => {
      if (col !== 'id' && col !== 'created_at' && col !== 'updated_at') {
        newRow[col] = null
      }
    })

    try {
      const { error } = await supabase
        .from(selectedTable)
        .insert([newRow])

      if (error) throw error

      toast.success('New row added')
      fetchTableData()
    } catch (error) {
      console.error('Error adding row:', error)
      toast.error('Failed to add row')
    }
  }

  const filteredData = data.filter(row => {
    if (!searchTerm) return true
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const formatCellValue = (value) => {
    if (value === null || value === undefined) return <span className="text-gray-400 italic">null</span>
    if (typeof value === 'boolean') return value ? '✓' : '✗'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className="max-w-full mx-auto bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Database Viewer</h2>
        </div>
        
        <button
          onClick={handleAddRow}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Row
        </button>
      </div>

      {/* --- NEW SECTION: MANAGEMENT TOOLS --- */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-2">
              <FileSpreadsheet className="text-blue-600 w-5 h-5" /> 
              Fiscal Year Export
            </h3>
            <p className="text-blue-700 text-sm mb-4">
              Download a single Excel file containing all current jobs and parts. 
              Tabs included: HP, Lenovo, Field Service, Master Parts.
            </p>
          </div>
          <button 
            onClick={handleArchive}
            disabled={isArchiving}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isArchiving ? 'Generating...' : <><Download size={18} /> Download Excel Archive</>}
          </button>
        </div>

        {/* Purge Card */}
        <div className="bg-red-50 p-5 rounded-xl border border-red-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2 mb-2">
              <AlertTriangle className="text-red-600 w-5 h-5" /> 
              Free Tier Maintenance
            </h3>
            <p className="text-red-700 text-sm mb-2">
              To stay within Supabase Free Tier limits, manually delete old records using the SQL Editor. 
              <strong>Archive first!</strong>
            </p>
          </div>
          <div className="bg-white p-3 rounded border border-red-200 font-mono text-xs text-slate-600 overflow-x-auto">
            <code>DELETE FROM jobs WHERE closed_at &lt; '2025-01-01';</code>
          </div>
        </div>
      </div>
      {/* --- END NEW SECTION --- */}

      {/* Existing Controls */}
      <div className="flex gap-4 mb-6 pt-6 border-t border-gray-100">
        <select
          value={selectedTable}
          onChange={(e) => {
            setSelectedTable(e.target.value)
            setSearchTerm('')
            setSortColumn(null)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          {availableTables.map(table => (
            <option key={table.name} value={table.name}>
              {table.icon} {table.label}
            </option>
          ))}
        </select>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search across all columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 flex items-center">
          {filteredData.length} rows
        </div>
      </div>

      {/* Table (Existing Code) */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No data in this table</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                {columns.map(column => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-2">
                      {column}
                      {sortColumn === column && (
                        sortDirection === 'asc' 
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  {columns.map(column => {
                    const isEditing = editingCell?.rowId === row.id && editingCell?.column === column
                    const isIdColumn = column === 'id' || column === 'created_at' || column === 'updated_at'

                    return (
                      <td 
                        key={column} 
                        className="px-4 py-3 text-sm"
                        onDoubleClick={() => !isIdColumn && handleCellEdit(row.id, column, row[column])}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveCell(row.id, column)
                                if (e.key === 'Escape') setEditingCell(null)
                              }}
                            />
                            <button
                              onClick={() => handleSaveCell(row.id, column)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={isIdColumn ? 'text-gray-400 font-mono text-xs' : ''}>
                              {formatCellValue(row[column])}
                            </span>
                            {!isIdColumn && (
                              <Edit2 
                                className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                                onClick={() => handleCellEdit(row.id, column, row[column])}
                              />
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}