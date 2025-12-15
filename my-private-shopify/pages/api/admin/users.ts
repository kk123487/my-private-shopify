import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET - List all users
    if (req.method === 'GET') {
      const { data: users, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({ users })
    }

    // POST - Create new user
    if (req.method === 'POST') {
      const { email, password, full_name, role } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Create user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: full_name || '',
          role: role || 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) throw profileError

      return res.status(201).json({ user: profile })
    }

    // PUT - Update user
    if (req.method === 'PUT') {
      const { userId, email, full_name, role } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      const updates: any = { updated_at: new Date().toISOString() }
      if (email) updates.email = email
      if (full_name !== undefined) updates.full_name = full_name
      if (role) updates.role = role

      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      return res.status(200).json({ user: data })
    }

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      const { userId } = req.query

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'User ID is required' })
      }

      // Delete from auth (will cascade to user_profiles)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (authError) throw authError

      return res.status(200).json({ message: 'User deleted successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error: any) {
    console.error('User management error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
