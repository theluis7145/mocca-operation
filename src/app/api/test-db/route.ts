import { NextResponse } from 'next/server'
import { findAllUsers } from '@/lib/d1'

export async function GET() {
  try {
    const users = await findAllUsers()
    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
      })),
      count: users.length,
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
