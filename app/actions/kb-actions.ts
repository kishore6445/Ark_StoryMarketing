'use server'

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(id: string | null): boolean {
  if (!id) return false
  return UUID_REGEX.test(id)
}

// Create node in database
export async function createKBNode(
  userId: string,
  parentId: string | null,
  text: string,
  position: number = 0
) {
  try {
    // Validate userId is a UUID
    if (!isValidUUID(userId)) {
      return { success: false, error: 'Invalid user ID format. Please set up authentication.' }
    }

    // Validate parentId if provided
    if (parentId && !isValidUUID(parentId)) {
      console.warn('[v0] Parent ID is not a UUID, creating without parent:', parentId)
      parentId = null
    }

    const { data, error } = await supabase
      .from('kb_pages')
      .insert([
        {
          user_id: userId,
          parent_id: parentId,
          title: text,
          content: text,
          position,
          completed: false,
        },
      ])
      .select()

    if (error) throw error
    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('[v0] Error creating node:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Update node in database
export async function updateKBNode(
  nodeId: string,
  userId: string,
  updates: {
    title?: string
    content?: string
    completed?: boolean
  }
) {
  try {
    // Skip update if nodeId is not a valid UUID (local test data)
    if (!isValidUUID(nodeId)) {
      console.warn('[v0] Skipping update for non-UUID node ID:', nodeId)
      return { success: true, data: null }
    }

    // Validate userId is a UUID
    if (!isValidUUID(userId)) {
      return { success: false, error: 'Invalid user ID format. Please set up authentication.' }
    }

    const { data, error } = await supabase
      .from('kb_pages')
      .update(updates)
      .eq('id', nodeId)
      .eq('user_id', userId)
      .select()

    if (error) throw error
    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('[v0] Error updating node:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Delete node from database (soft delete)
export async function deleteKBNode(nodeId: string, userId: string) {
  try {
    // Skip delete if nodeId is not a valid UUID (local test data)
    if (!isValidUUID(nodeId)) {
      console.warn('[v0] Skipping delete for non-UUID node ID:', nodeId)
      return { success: true }
    }

    // Validate userId is a UUID
    if (!isValidUUID(userId)) {
      return { success: false, error: 'Invalid user ID format. Please set up authentication.' }
    }

    const { error } = await supabase
      .from('kb_pages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', nodeId)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('[v0] Error deleting node:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Toggle node completion
export async function toggleKBNodeComplete(nodeId: string, userId: string, completed: boolean) {
  try {
    // Skip toggle if nodeId is not a valid UUID (local test data)
    if (!isValidUUID(nodeId)) {
      console.warn('[v0] Skipping completion toggle for non-UUID node ID:', nodeId)
      return { success: true, data: null }
    }

    // Validate userId is a UUID
    if (!isValidUUID(userId)) {
      return { success: false, error: 'Invalid user ID format. Please set up authentication.' }
    }

    const { data, error } = await supabase
      .from('kb_pages')
      .update({ completed })
      .eq('id', nodeId)
      .eq('user_id', userId)
      .select()

    if (error) throw error
    return { success: true, data: data?.[0] }
  } catch (error) {
    console.error('[v0] Error toggling completion:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Fetch all pages for a user
export async function fetchKBPages(userId: string) {
  try {
    // Validate userId is a UUID
    if (!isValidUUID(userId)) {
      console.warn('[v0] Skipping fetch for non-UUID user ID:', userId)
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from('kb_pages')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('position', { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('[v0] Error fetching pages:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Add tag to node
export async function addKBNodeTag(nodeId: string, userId: string, tagName: string) {
  try {
    // Skip if nodeId is not a valid UUID (local test data)
    if (!isValidUUID(nodeId)) {
      console.warn('[v0] Skipping tag add for non-UUID node ID:', nodeId)
      return { success: true }
    }

    // Validate userId is a UUID
    if (!isValidUUID(userId)) {
      return { success: false, error: 'Invalid user ID format. Please set up authentication.' }
    }

    // First, get or create the tag
    const { data: tagData, error: tagError } = await supabase
      .from('kb_tags')
      .select('id')
      .eq('user_id', userId)
      .eq('name', tagName)
      .single()

    let tagId: string

    if (tagError && tagError.code === 'PGRST116') {
      // Tag doesn't exist, create it
      const { data: newTag, error: createError } = await supabase
        .from('kb_tags')
        .insert([{ user_id: userId, name: tagName, color: 'blue' }])
        .select()

      if (createError) throw createError
      tagId = newTag?.[0]?.id
    } else if (tagError) {
      throw tagError
    } else {
      tagId = tagData?.id
    }

    // Add the tag to the page
    const { error: linkError } = await supabase
      .from('kb_page_tags')
      .insert([{ page_id: nodeId, tag_id: tagId }])

    if (linkError) throw linkError
    return { success: true }
  } catch (error) {
    console.error('[v0] Error adding tag:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Remove tag from node
export async function removeKBNodeTag(nodeId: string, tagId: string) {
  try {
    // Skip if nodeId is not a valid UUID (local test data)
    if (!isValidUUID(nodeId)) {
      console.warn('[v0] Skipping tag remove for non-UUID node ID:', nodeId)
      return { success: true }
    }

    const { error } = await supabase
      .from('kb_page_tags')
      .delete()
      .eq('page_id', nodeId)
      .eq('tag_id', tagId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('[v0] Error removing tag:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
