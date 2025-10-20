#!/usr/bin/env ts-node
/**
 * Quick script to manually verify a user by email
 * Usage: npx ts-node src/scripts/verify-user.ts <email>
 */

import prisma from '../db'

async function verifyUserByEmail(email: string) {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ User not found with email: ${email}`)
      process.exit(1)
    }

    if (user.verified) {
      console.log(`✅ User ${email} is already verified`)
      process.exit(0)
    }

    // Update user to verified
    const updated = await prisma.user.update({
      where: { email },
      data: { verified: true },
    })

    console.log(`✅ Successfully verified user: ${updated.email}`)
    console.log(`   User ID: ${updated.id}`)
    console.log(`   Name: ${updated.name || 'N/A'}`)
  } catch (error) {
    console.error('❌ Error verifying user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('❌ Usage: npx ts-node src/scripts/verify-user.ts <email>')
  process.exit(1)
}

verifyUserByEmail(email)
