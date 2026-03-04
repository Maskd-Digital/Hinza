'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Notification } from '@/types/complaint'

interface NotificationsDropdownProps {
  companyId: string
}

export default function NotificationsDropdown({ companyId }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async (unreadOnly = false) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/notifications?company_id=${companyId}&limit=20${unreadOnly ? '&unread_only=true' : ''}`
      )
      if (!res.ok) return
      const data = await res.json()
      if (unreadOnly) {
        setUnreadCount(Array.isArray(data) ? data.length : 0)
      } else {
        setNotifications(Array.isArray(data) ? data : [])
        setUnreadCount((Array.isArray(data) ? data : []).filter((n: Notification) => !n.read_at).length)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(true)
  }, [companyId])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, companyId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-white hover:bg-white/10"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-3 py-2">
            <h3 className="text-sm font-semibold text-[#081636]">Notifications</h3>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0108B8] border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">No notifications</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={
                    n.related_entity_type === 'complaint' && n.related_entity_id
                      ? `/qa-manager/${companyId}/complaints/${n.related_entity_id}`
                      : `/qa-manager/${companyId}/complaints`
                  }
                  onClick={() => {
                    if (!n.read_at) markRead(n.id)
                    setOpen(false)
                  }}
                  className={`block border-b border-gray-50 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                    !n.read_at ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-[#081636]">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{n.body}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
