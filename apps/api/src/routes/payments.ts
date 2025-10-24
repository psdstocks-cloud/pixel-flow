router.post('/add-credits', authenticateUser, async (req, res) => {
  const { userId, credits, subscriptionId } = req.body;
  
  // Verify payment via webhook or payment provider
  const paymentValid = await verifyPayment(subscriptionId);
  
  if (!paymentValid) {
    return res.status(400).json({ error: 'Invalid payment' });
  }
  
  // Use database transaction for atomicity
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: credits } }
  });
  
  res.json({ success: true, credits: updatedUser.credits });
});