"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Database,
  Search,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  FileSpreadsheet,
  AlertTriangle,
  Download,
} from "lucide-react"
import { toast } from "sonner"

const TABLES = [
  { name: "jobs", label: "Jobs", icon: "📋" },
  { name: "parts", label: "Parts (New)", icon: "🔧" },
  { name: "old_parts", label: "Old Parts (RMA)", icon: "♻️" },
  { name: "engineers", label: "Engineers", icon: "👷" },
  { name: "users", label: "Users", icon: "👤" },
]

export function DatabaseViewerTab() {
  const [selectedTable, setSelectedTable] = useState("jobs")
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: string } | null>(null)
  const [editValue, setEditValue] = useState("")

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from(selectedTable).select("*")
      if (sortColumn) {
        query = query.order(sortColumn, { ascending: sortDirection === "asc" })
      }
      const { data: tableData, error } = await query

      if (error) throw error

      setData(tableData || [])
      if (tableData && tableData.length > 0) {
        setColumns(Object.keys(tableData[0]))
      } else {
        setColumns([])
      }
    } catch {
      toast.error(`Failed to load ${selectedTable}`)
    } finally {
      setLoading(false)
    }
  }, [selectedTable, sortColumn, sortDirection])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleSaveCell = async (rowId: string, column: string) => {
    try {
      const { error } = await supabase
        .from(selectedTable)
        .update({ [column]: editValue })
        .eq("id", rowId)
      if (error) throw error
      toast.success("Updated successfully")
      fetchTableData()
      setEditingCell(null)
    } catch {
      toast.error("Failed to update")
    }
  }

  const handleDeleteRow = async (rowId: string) => {
    if (!confirm("Are you sure you want to delete this row?")) return
    try {
      const { error } = await supabase.from(selectedTable).delete().eq("id", rowId)
      if (error) throw error
      toast.success("Row deleted successfully")
      fetchTableData()
    } catch {
      toast.error("Failed to delete row")
    }
  }

  const handleAddRow = async () => {
    const newRow: Record<string, null> = {}
    columns.forEach((col) => {
      if (!["id", "created_at", "updated_at"].includes(col)) {
        newRow[col] = null
      }
    })
    try {
      const { error } = await supabase.from(selectedTable).insert([newRow])
      if (error) throw error
      toast.success("New row added")
      fetchTableData()
    } catch {
      toast.error("Failed to add row")
    }
  }

  const filteredData = data.filter((row) => {
    if (!searchTerm) return true
    return Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const formatCell = (value: unknown) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">null</span>
    if (typeof value === "boolean") return value ? "✓" : "✗"
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-primary" />
            <CardTitle>Database Viewer</CardTitle>
          </div>
          <Button onClick={handleAddRow} className="gap-2">
            <Plus className="w-4 h-4" /> Add Row
          </Button>
        </CardHeader>
        <CardContent>
          {/* Management Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Alert className="bg-blue-50 border-blue-200">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Fiscal Year Export</AlertTitle>
              <AlertDescription className="text-blue-700 text-sm mb-3">
                Download all jobs and parts as Excel file.
              </AlertDescription>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Download className="w-4 h-4" /> Download Excel Archive
              </Button>
            </Alert>

            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertTitle className="text-red-900">Free Tier Maintenance</AlertTitle>
              <AlertDescription className="text-red-700 text-sm mb-3">
                Archive first, then delete old records via SQL Editor.
              </AlertDescription>
              <code className="text-xs bg-white p-2 rounded border block">
                DELETE FROM jobs WHERE closed_at &lt; &apos;2025-01-01&apos;;
              </code>
            </Alert>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-6 pt-6 border-t">
            <Select
              value={selectedTable}
              onValueChange={(v) => {
                setSelectedTable(v)
                setSearchTerm("")
                setSortColumn(null)
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TABLES.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.icon} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground flex items-center">
              {filteredData.length} rows
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-4">Loading...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No data in this table</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {columns.map((col) => (
                      <TableHead
                        key={col}
                        onClick={() => handleSort(col)}
                        className="cursor-pointer hover:bg-muted transition"
                      >
                        <div className="flex items-center gap-2">
                          {col}
                          {sortColumn === col &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            ))}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, rowIndex) => (
                    <TableRow key={(row.id as string) || rowIndex}>
                      {columns.map((col) => {
                        const isEditing = editingCell?.rowId === row.id && editingCell?.column === col
                        const isIdCol = ["id", "created_at", "updated_at"].includes(col)

                        return (
                          <TableCell
                            key={col}
                            className="text-sm"
                            onDoubleClick={() => {
                              if (!isIdCol) {
                                setEditingCell({ rowId: row.id as string, column: col })
                                setEditValue(String(row[col] ?? ""))
                              }
                            }}
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-7"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveCell(row.id as string, col)
                                    if (e.key === "Escape") setEditingCell(null)
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-600"
                                  onClick={() => handleSaveCell(row.id as string, col)}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => setEditingCell(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={isIdCol ? "text-muted-foreground font-mono text-xs" : ""}>
                                  {formatCell(row[col])}
                                </span>
                                {!isIdCol && (
                                  <Edit2
                                    className="w-3 h-3 text-muted-foreground opacity-0 hover:opacity-100 cursor-pointer"
                                    onClick={() => {
                                      setEditingCell({ rowId: row.id as string, column: col })
                                      setEditValue(String(row[col] ?? ""))
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRow(row.id as string)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
