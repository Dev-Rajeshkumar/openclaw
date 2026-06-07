import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.statusLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const hashedPassword = await bcrypt.hash('Demo@1234', 12);

  const user = await prisma.user.create({
    data: {
      email: 'demo@billingbee.in',
      password: hashedPassword,
      fullName: 'Rajesh Kumar',
      isEmailVerified: true,
    },
  });

  console.log('✅ Demo user created:', user.email);

  // Create businesses
  const business1 = await prisma.business.create({
    data: {
      userId: user.id,
      name: 'BillingBee Solutions',
      gstNumber: '33AABCU9603R1ZM',
      phone: '9876543210',
      address: '123, Gandhi Road, Coimbatore, Tamil Nadu - 641001',
      invoicePrefix: 'BBS',
      plan: 'GOLD',
    },
  });

  const business2 = await prisma.business.create({
    data: {
      userId: user.id,
      name: 'Freelance Dev Studio',
      invoicePrefix: 'FDS',
      plan: 'SILVER',
    },
  });

  console.log('✅ Businesses created: 2');

  // Create clients for business1
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        userId: user.id,
        businessId: business1.id,
        name: 'TechCorp India Pvt Ltd',
        email: 'accounts@techcorp.in',
        phone: '9876543211',
        gstNumber: '29AABCT1234F1Z5',
        address: '456, MG Road, Bengaluru, Karnataka - 560001',
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        businessId: business1.id,
        name: 'GreenLeaf Enterprises',
        email: 'billing@greenleaf.co.in',
        phone: '9876543212',
        address: '78, Station Road, Chennai, Tamil Nadu - 600001',
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        businessId: business2.id,
        name: 'Arun Freelance Client',
        email: 'arun@gmail.com',
        phone: '9988776655',
      },
    }),
  ]);

  console.log('✅ Clients created:', clients.length);

  // Create sample invoices
  const inv1 = await prisma.invoice.create({
    data: {
      userId: user.id,
      businessId: business1.id,
      clientId: clients[0].id,
      invoiceNumber: 'BBS-00001',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'SENT',
      gstType: 'IGST',
      gstRate: 18,
      subtotal: 50000,
      gstAmount: 9000,
      total: 59000,
      notes: 'Web development services for Q1 2025',
      createdBy: user.id,
      updatedBy: user.id,
      items: {
        create: [
          { description: 'Frontend Development - React', hsnCode: '998314', quantity: 160, rate: 200, amount: 32000 },
          { description: 'Backend Development - Node.js', hsnCode: '998314', quantity: 80, rate: 225, amount: 18000 },
        ],
      },
    },
  });

  // Increment invoice counter
  await prisma.business.update({
    where: { id: business1.id },
    data: { nextInvoiceNo: 2 },
  });

  // Status logs for inv1
  await prisma.statusLog.create({
    data: {
      entity: 'Invoice',
      entityId: inv1.id,
      action: 'CREATED',
      newValue: 'DRAFT',
      description: 'Invoice BBS-00001 created (₹59000)',
      changedBy: user.id,
      metadata: { total: 59000, gstAmount: 9000 },
    },
  });

  await prisma.statusLog.create({
    data: {
      entity: 'Invoice',
      entityId: inv1.id,
      action: 'STATUS_CHANGED',
      oldValue: 'DRAFT',
      newValue: 'SENT',
      description: 'Invoice BBS-00001 status: DRAFT → SENT',
      changedBy: user.id,
    },
  });

  const inv2 = await prisma.invoice.create({
    data: {
      userId: user.id,
      businessId: business1.id,
      clientId: clients[1].id,
      invoiceNumber: 'BBS-00002',
      invoiceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      status: 'PAID',
      gstType: 'CGST_SGST',
      gstRate: 18,
      subtotal: 25000,
      gstAmount: 4500,
      total: 29500,
      notes: 'Monthly maintenance support',
      createdBy: user.id,
      updatedBy: user.id,
      items: {
        create: [
          { description: 'Application Maintenance & Support', hsnCode: '998314', quantity: 50, rate: 500, amount: 25000 },
        ],
      },
    },
  });

  await prisma.business.update({
    where: { id: business1.id },
    data: { nextInvoiceNo: 3 },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv2.id,
      userId: user.id,
      amount: 29500,
      method: 'UPI',
      reference: 'UPI-20250607-001',
      status: 'COMPLETED',
      paidAt: new Date(),
    },
  });

  console.log('✅ Sample invoices created: 2');
  console.log('✅ Sample payment recorded');
  console.log('✅ Status logs created');
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Email: demo@billingbee.in');
  console.log('  Password: Demo@1234');
  console.log('');
  console.log('Businesses:');
  console.log(`  1. ${business1.name} (${business1.id})`);
  console.log(`  2. ${business2.name} (${business2.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
