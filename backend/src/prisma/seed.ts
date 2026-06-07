import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const hashedPassword = await bcrypt.hash('Demo@1234', 12);

  const user = await prisma.user.create({
    data: {
      email: 'demo@billingbee.in',
      password: hashedPassword,
      fullName: 'Rajesh Kumar',
      businessName: 'BillingBee Solutions',
      gstNumber: '33AABCU9603R1ZM',
      phone: '9876543210',
      address: '123, Gandhi Road, Coimbatore, Tamil Nadu - 641001',
      plan: 'GOLD',
    },
  });

  console.log('✅ Demo user created:', user.email);

  // Create sample clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        userId: user.id,
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
        name: 'GreenLeaf Enterprises',
        email: 'billing@greenleaf.co.in',
        phone: '9876543212',
        address: '78, Station Road, Chennai, Tamil Nadu - 600001',
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: 'Freelance Client - Arun',
        email: 'arun@gmail.com',
        phone: '9988776655',
      },
    }),
  ]);

  console.log('✅ Sample clients created:', clients.length);

  // Create sample invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: clients[0].id,
      invoiceNumber: 'BB-00001',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'SENT',
      gstType: 'IGST',
      gstRate: 18,
      subtotal: 50000,
      gstAmount: 9000,
      total: 59000,
      notes: 'Web development services for Q1 2025',
      items: {
        create: [
          {
            description: 'Frontend Development - React',
            hsnCode: '998314',
            quantity: 160,
            rate: 200,
            amount: 32000,
          },
          {
            description: 'Backend Development - Node.js',
            hsnCode: '998314',
            quantity: 80,
            rate: 225,
            amount: 18000,
          },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: clients[1].id,
      invoiceNumber: 'BB-00002',
      invoiceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      status: 'PAID',
      gstType: 'CGST_SGST',
      gstRate: 18,
      subtotal: 25000,
      gstAmount: 4500,
      total: 29500,
      notes: 'Monthly maintenance support',
      items: {
        create: [
          {
            description: 'Application Maintenance & Support',
            hsnCode: '998314',
            quantity: 50,
            rate: 500,
            amount: 25000,
          },
        ],
      },
    },
  });

  // Record payment for invoice2
  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      userId: user.id,
      amount: 29500,
      method: 'UPI',
      reference: 'UPI-20250607-001',
      status: 'COMPLETED',
      paidAt: new Date(),
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: clients[2].id,
      invoiceNumber: 'BB-00003',
      invoiceDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'OVERDUE',
      gstType: 'CGST_SGST',
      gstRate: 18,
      subtotal: 15000,
      gstAmount: 2700,
      total: 17700,
      notes: 'Logo and branding design',
      items: {
        create: [
          {
            description: 'Logo Design & Brand Identity',
            hsnCode: '998314',
            quantity: 1,
            rate: 15000,
            amount: 15000,
          },
        ],
      },
    },
  });

  console.log('✅ Sample invoices created: 3');
  console.log('✅ Sample payment recorded: 1');
  console.log('');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Email: demo@billingbee.in');
  console.log('  Password: Demo@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
