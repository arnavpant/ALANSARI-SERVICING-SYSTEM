"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: () => void
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "",
    engineerName: "",
    engineerPhone: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let engineerId = null

      // Create engineer entry if role is Engineer
      if (formData.role === "Engineer") {
        const { data: existingEngineers } = await supabase
          .from("engineers")
          .select("id")
          .order("id", { ascending: false })
          .limit(1)

        let nextNum = 1
        if (existingEngineers && existingEngineers.length > 0) {
          const lastId = existingEngineers[0].id
          const match = lastId.match(/\d+/)
          if (match) nextNum = Number.parseInt(match[0]) + 1
        }

        engineerId = `ENG${nextNum}`

        const { error: engError } = await supabase.from("engineers").insert([
          {
            id: engineerId,
            name: formData.engineerName,
            email: formData.email,
            phone: formData.engineerPhone || null,
            status: "active",
          },
        ])

        if (engError) {
          toast.error(`Failed to create engineer: ${engError.message}`)
          setLoading(false)
          return
        }
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
      })

      if (authError) {
        toast.error(`Auth Error: ${authError.message}`)
        setLoading(false)
        return
      }

      // Insert user into public.users table
      const { error: dbError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          role: formData.role,
          linked_engineer_id: engineerId,
        },
      ])

      if (dbError) {
        toast.error(`Database Error: ${dbError.message}`)
        setLoading(false)
        return
      }

      toast.success(`User ${formData.email} created successfully!`)
      onUserCreated()
      resetForm()
      onClose()
    } catch {
      toast.error("Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      fullName: "",
      role: "",
      engineerName: "",
      engineerPhone: "",
    })
    setShowPassword(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        resetForm()
        onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Create New User
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Password *</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label>Role *</Label>
            <Select required value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Front Desk">Front Desk</SelectItem>
                <SelectItem value="Engineer">Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === "Engineer" && (
            <>
              <div className="space-y-2">
                <Label>Engineer Name *</Label>
                <Input
                  required
                  value={formData.engineerName}
                  onChange={(e) => setFormData({ ...formData, engineerName: e.target.value })}
                  placeholder="e.g., John Doe"
                />
                <p className="text-xs text-muted-foreground">This will create a new engineer profile</p>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={formData.engineerPhone}
                  onChange={(e) => setFormData({ ...formData, engineerPhone: e.target.value })}
                  placeholder="+968 XXXX XXXX"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onClose()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
