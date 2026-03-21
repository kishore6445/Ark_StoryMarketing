"use client"

// Production Workflowy-inspired Knowledge Base
import { useState, useMemo, useRef, useEffect } from "react"
import { ChevronRight, ChevronDown, Plus, Home, Search, ChevronLeft } from "lucide-react"
import { useWorkflowyState } from "@/hooks/use-workflowy-state"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { OutlineRendererEnhanced } from "@/components/kb-outline-renderer-enhanced"
import { KBPage, KBNode } from "@/lib/kb-types"
import { flattenNodes, getNextNode, getPreviousNode, getFirstChild } from "@/lib/kb-navigation"
import { useAuth } from "@/hooks/use-auth"
import {
  createKBNode,
  updateKBNode,
  deleteKBNode,
  toggleKBNodeComplete,
  fetchKBTree,
  addKBNodeTag,
  removeKBNodeTag,
} from "@/app/actions/kb-actions"

// Default data structure
const KB_STORAGE_KEY = "kb-page-data"
const KB_CLEAR_FLAG_KEY = "kb-page-data-cleared-v1"

const defaultPage: KBPage = {
  id: "finance",
  title: "Finance",
  createdAt: new Date(),
  updatedAt: new Date(),
  nodes: [],
}

const allPages = [
  { id: "finance", title: "Finance", icon: "💰", children: [] },
]

function getActionErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  if (typeof error === "object" && error !== null) {
    const message = Reflect.get(error, "message")
    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  return "Unknown error"
}

export default function KnowledgeBasePage() {
  const {
    currentPage,
    setCurrentPage,
    selection,
    setSelection,
    zoomPath,
    zoomIn,
    zoomOut,
    getRootNodes,
    addNode,
    editNode,
    deleteNode,
    toggleComplete,
    indentNode,
    outdentNode,
    searchQuery,
    setSearchQuery,
  } = useWorkflowyState(defaultPage)

  const { user } = useAuth()
  const userId = user?.id ?? ""

  const [selectedPageId, setSelectedPageId] = useState("finance")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [autoEditNodeId, setAutoEditNodeId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const undoStackRef = useRef<Array<{ type: string; nodeId: string }>>([])
  const redoStackRef = useRef<Array<{ type: string; nodeId: string }>>([])

  // Persist KB data to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(currentPage))
    } catch (e) {
      console.error("[v0] Failed to save KB data to localStorage:", e)
    }
  }, [currentPage])

  // Restore KB data from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const shouldClearStoredData = !localStorage.getItem(KB_CLEAR_FLAG_KEY)

      if (shouldClearStoredData) {
        localStorage.removeItem(KB_STORAGE_KEY)
        localStorage.setItem(KB_CLEAR_FLAG_KEY, "true")
        setCurrentPage(defaultPage)
        setSelectedNodeId(null)
        setExpandedIds(new Set())
        console.log("[v0] Cleared Knowledge Base local data")
        return
      }

      const saved = localStorage.getItem(KB_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setCurrentPage(parsed)
        console.log("[v0] Restored KB data from localStorage")
      }
    } catch (e) {
      console.error("[v0] Failed to restore KB data from localStorage:", e)
    }
  }, [])

  // Load KB data from database when user is authenticated
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const result = await fetchKBTree(userId)
        if (cancelled) return
        if (result.success && result.nodes.length > 0) {
          setCurrentPage((prev) => ({ ...prev, nodes: result.nodes as KBNode[] }))
          console.log("[KB] Loaded", result.nodes.length, "root nodes from database")
        } else if (!result.success) {
          console.warn("[KB] Failed to load from DB:", result.error)
        }
      } catch (e) {
        console.warn("[KB] DB load error:", e)
      }
    })()
    return () => { cancelled = true }
  }, [userId])

  const handleDeleteNode = async (nodeId: string) => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const result = await deleteKBNode(nodeId, userId)
      if (result.success) {
        deleteNode(nodeId)
        console.log("[v0] Node deleted from backend:", nodeId)
      } else {
        setSyncError(result.error || "Failed to delete node")
      }
    } catch (error) {
      setSyncError(getActionErrorMessage(error))
    } finally {
      setIsSyncing(false)
    }
  }

  // Wrap addNode to sync with backend
  const handleAddNode = async (parentId: string | null, text: string = "") => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const result = await createKBNode(userId, parentId, text, 0)
      if (result.success) {
        // Use the DB-generated UUID as the local node ID so subsequent
        // toggle/edit/delete calls send the correct UUID to the database.
        const dbId = result.data?.id
        const newId = addNode(parentId, text, undefined, dbId)
        setSelectedNodeId(newId)
        setAutoEditNodeId(newId)
        if (dbId) {
          console.log("[KB] Node created in backend:", dbId)
        } else {
          console.log("[KB] Node created in local-only mode")
        }
        return newId
      }

      setSyncError(result.error || "Failed to create node")
      const fallbackNodeId = addNode(parentId, text)
      setSelectedNodeId(fallbackNodeId)
      setAutoEditNodeId(fallbackNodeId)
      return fallbackNodeId // Fallback to local state
    } catch (error) {
      setSyncError(getActionErrorMessage(error))
      const fallbackNodeId = addNode(parentId, text)
      setSelectedNodeId(fallbackNodeId)
      setAutoEditNodeId(fallbackNodeId)
      return fallbackNodeId
    } finally {
      setIsSyncing(false)
    }
  }

  // Wrap editNode to sync with backend
  const handleEditNode = async (nodeId: string, text: string) => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const result = await updateKBNode(nodeId, userId, { title: text, content: text })
      if (result.success) {
        editNode(nodeId, text)
        console.log("[v0] Node updated in backend:", nodeId)
      } else {
        setSyncError(result.error || "Failed to update node")
      }
    } catch (error) {
      setSyncError(getActionErrorMessage(error))
    } finally {
      setIsSyncing(false)
    }
  }

  // Wrap toggleComplete to sync with backend
  const handleToggleComplete = async (nodeId: string) => {
    const findInTree = (nodes: KBNode[], id: string): KBNode | null => {
      for (const n of nodes) {
        if (n.id === id) return n
        if (n.children?.length) { const f = findInTree(n.children, id); if (f) return f }
      }
      return null
    }
    const node = findInTree(currentPage.nodes, nodeId)
    const newCompleted = !node?.completed
    
    setIsSyncing(true)
    setSyncError(null)
    try {
      const result = await toggleKBNodeComplete(nodeId, userId, newCompleted)
      if (result.success) {
        toggleComplete(nodeId)
        console.log("[v0] Node completion toggled in backend:", nodeId)
      } else {
        setSyncError(result.error || "Failed to update node")
      }
    } catch (error) {
      setSyncError(getActionErrorMessage(error))
    } finally {
      setIsSyncing(false)
    }
  }

  // Wrap addTag to sync with backend
  const handleAddTag = async (nodeId: string, tag: string) => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const result = await addKBNodeTag(nodeId, userId, tag)
      if (result.success) {
        addTag(nodeId, tag)
        console.log("[v0] Tag added in backend:", tag)
      } else {
        setSyncError(result.error || "Failed to add tag")
      }
    } catch (error) {
      setSyncError(getActionErrorMessage(error))
    } finally {
      setIsSyncing(false)
    }
  }
  useKeyboardShortcuts([
    {
      keys: ["cmd", "n"],
      description: "New item",
      action: () => {
        handleAddNode(selectedNodeId, "").then((newId) => {
          if (newId) setSelectedNodeId(newId)
        })
      },
    },
    {
      keys: ["enter"],
      description: "New item after selected",
      action: () => {
        if (selectedNodeId) {
          const root = getRootNodes()
          const nodeIndex = root.findIndex((n) => n.id === selectedNodeId)
          if (nodeIndex !== -1) {
            handleAddNode(null, "").then((newId) => {
              if (newId) setSelectedNodeId(newId)
            })
          }
        }
      },
    },
    {
      keys: ["tab"],
      description: "Indent",
      action: () => {
        if (selectedNodeId) indentNode(selectedNodeId)
      },
    },
    {
      keys: ["shift", "tab"],
      description: "Outdent",
      action: () => {
        if (selectedNodeId) outdentNode(selectedNodeId)
      },
    },
    {
      keys: ["arrowdown"],
      description: "Next item",
      action: () => {
        if (selectedNodeId) {
          const next = getNextNode(getRootNodes(), selectedNodeId)
          if (next) setSelectedNodeId(next.id)
        }
      },
    },
    {
      keys: ["arrowup"],
      description: "Previous item",
      action: () => {
        if (selectedNodeId) {
          const prev = getPreviousNode(getRootNodes(), selectedNodeId)
          if (prev) setSelectedNodeId(prev.id)
        }
      },
    },
    {
      keys: ["arrowright"],
      description: "Expand/First child",
      action: () => {
        if (selectedNodeId) {
          const node = getRootNodes().find((n) => n.id === selectedNodeId)
          if (node && node.children.length > 0) {
            if (!expandedIds.has(selectedNodeId)) {
              toggleExpandNode(selectedNodeId)
            } else {
              const firstChild = getFirstChild(node)
              if (firstChild) setSelectedNodeId(firstChild.id)
            }
          }
        }
      },
    },
    {
      keys: ["cmd", "z"],
      description: "Undo",
      action: () => {
        // Basic undo - in production would use the undo stack
        console.log("[v0] Undo pressed")
      },
    },
  ])

  const toggleExpandNode = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const addTag = (nodeId: string, tag: string) => {
    setCurrentPage((prev) => {
      const updateNodes = (nodes: KBNode[]): KBNode[] => {
        return nodes.map((node) => {
          if (node.id === nodeId && !node.tags.includes(tag)) {
            return { ...node, tags: [...node.tags, tag], updatedAt: new Date() }
          }
          if (node.children) {
            return { ...node, children: updateNodes(node.children) }
          }
          return node
        })
      }

      return {
        ...prev,
        nodes: updateNodes(prev.nodes),
      }
    })
  }

  const removeTag = (nodeId: string, tag: string) => {
    setCurrentPage((prev) => {
      const updateNodes = (nodes: KBNode[]): KBNode[] => {
        return nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              tags: node.tags.filter((t) => t !== tag),
              updatedAt: new Date(),
            }
          }
          if (node.children) {
            return { ...node, children: updateNodes(node.children) }
          }
          return node
        })
      }

      return {
        ...prev,
        nodes: updateNodes(prev.nodes),
      }
    })
  }

  const getCurrentNode = () => {
    if (!selectedNodeId) return null
    const findNode = (nodes: KBNode[]): KBNode | null => {
      for (const node of nodes) {
        if (node.id === selectedNodeId) return node
        if (node.children) {
          const found = findNode(node.children)
          if (found) return found
        }
      }
      return null
    }
    return findNode(currentPage.nodes)
  }

  const rootNodes = getRootNodes()

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return rootNodes

    const filterNodes = (nodes: KBNode[]): KBNode[] => {
      return nodes
        .filter((n) => n.text.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((n) => ({
          ...n,
          children: filterNodes(n.children),
        }))
    }

    return filterNodes(rootNodes)
  }, [rootNodes, searchQuery])

  return (
    <div className="flex h-screen bg-white">
      {/* Sync Error Notification */}
      {syncError && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg shadow-sm z-50 max-w-xs text-xs">
          <div className="flex justify-between items-start gap-2">
            <span>{syncError}</span>
            <button
              onClick={() => setSyncError(null)}
              className="text-red-600 hover:text-red-800 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Sync Loading Indicator */}
      {isSyncing && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg shadow-sm z-50 text-xs font-medium">
          Syncing...
        </div>
      )}

      {/* Minimalist Left Sidebar */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Pages</div>
          <button className="text-xs text-gray-600 hover:text-gray-900 transition-colors">📍 Home</button>
        </div>

        {/* Page List - Clean */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {allPages.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPageId(page.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedPageId === page.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="mr-2">{page.icon}</span>{page.title}
            </button>
          ))}
        </div>

        {/* New Page Button */}
        <div className="px-2 py-3 border-t border-gray-100">
          <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors">
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Clean Header - No clutter */}
        <div className="border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => zoomPath.length > 0 && zoomOut()}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Home
            </button>
            {zoomPath.map((breadcrumb, idx) => (
              <div key={breadcrumb.id} className="flex items-center gap-2 text-gray-400">
                <span>›</span>
                <button
                  onClick={() => {
                    while (zoomPath.length > idx + 1) {
                      zoomOut()
                    }
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {breadcrumb.text}
                </button>
              </div>
            ))}
          </div>
          
          {/* Minimalist Search */}
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">{currentPage.title}</h1>
            <div className="max-w-2xl">
              <OutlineRendererEnhanced
                nodes={filteredNodes}
                selectedId={selectedNodeId}
                autoEditNodeId={autoEditNodeId}
                onAutoEditHandled={() => setAutoEditNodeId(null)}
                onSelectNode={setSelectedNodeId}
                onEditNode={handleEditNode}
                onDeleteNode={handleDeleteNode}
                onToggleComplete={handleToggleComplete}
                onAddNode={handleAddNode}
                onIndent={indentNode}
                onOutdent={outdentNode}
                onZoom={zoomIn}
                onAddTag={handleAddTag}
                onRemoveTag={removeTag}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpandNode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Remove Details Panel for cleaner focus - users can access via selection */}
    </div>
  )
}
                <div className="mb-6">
                  <label className="text-xs font-medium text-gray-600 block mb-2">Status</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleComplete(selectedNodeId)}
                      className={`px-3 py-1 text-xs rounded border transition-colors ${
                        getCurrentNode()?.completed
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {getCurrentNode()?.completed ? "✓ Done" : "Pending"}
                    </button>
                  </div>
                </div>

                {/* Created/Updated */}
                <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-1">
                  <p>Created: {getCurrentNode()?.createdAt ? new Date(getCurrentNode()!.createdAt).toLocaleDateString() : 'N/A'}</p>
                  <p>Updated: {getCurrentNode()?.updatedAt ? new Date(getCurrentNode()!.updatedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
