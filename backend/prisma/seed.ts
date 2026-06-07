import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (in development)
  if (process.env.NODE_ENV !== 'development') {
    console.log('Skipping seed in non-development environment.');
    return;
  }

  // Delete in reverse order of dependencies
  await prisma.statusLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.file.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.recurringInvoice.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.service.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.business.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  // ─── Create Demo User ──────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Demo@1234', 12);

  const user = await prisma.user.create({
    data: {
      email: 'demo@billingbee.com',
      password: hashedPassword,
      fullName: 'Demo User',
      phone: '+91 9876543210',
      currency: 'INR',
      language: 'en',
      timezone: 'Asia/Kolkata',
      plan: 'Professional',
      isEmailVerified: true,
    },
  });

  console.log('✅ Created demo user:', user.email);

  // ─── Create Subscription ───────────────────────────────────────────
  const subEndDate = new Date();
  subEndDate.setFullYear(subEndDate.getFullYear() + 1);

  await prisma.subscription.create({
    data: {
      userId: user.id,
      plan: 'Professional',
      status: 'Active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: subEndDate,
    },
  });

  // ─── Create Business ───────────────────────────────────────────────
  const business = await prisma.business.create({
    data: {
      userId: user.id,
      name: 'Acme Solutions Pvt Ltd',
      gstNumber: '29AABCU9603R1ZM',
      pan: 'AABCU9603R',
      phone: '+91 80 12345678',
      address: '123 Business Park, Bangalore, Karnataka 560001',
      invoicePrefix: 'ACM',
      nextInvoiceNo: 4,
    },
  });

  console.log('✅ Created business:', business.name);

  // ─── Create Team Member (Owner) ────────────────────────────────────
  await prisma.teamMember.create({
    data: {
      businessId: business.id,
      userId: user.id,
      role: 'Owner',
      permissions: ['*'],
      invitedBy: user.id,
    },
  });

  // ─── Create Clients ────────────────────────────────────────────────
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        userId: user.id,
        businessId: business.id,
        name: 'Rajesh Kumar',
        company: 'TechStart India',
        email: 'rajesh@techstart.in',
        phone: '+91 9876543211',
        gstNumber: '27AADCT1234A1Z5',
        billingAddress: '456 Tech Park, Mumbai, Maharashtra 400001',
        tags: ['tech', 'recurring'],
        status: 'Active',
        createdBy: user.id,
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        businessId: business.id,
        name: 'Priya Sharma',
        company: 'GreenLeaf Organics',
        email: 'priya@greenleaf.in',
        phone: '+91 9876543212',
        billingAddress: '789 Market Road, Delhi 110001',
        tags: ['retail'],
        status: 'Active',
        createdBy: user.id,
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        businessId: business.id,
        name: 'Amit Patel',
        company: 'BuildRight Constructions',
        email: 'amit@buildright.in',
        phone: '+91 9876543213',
        gstNumber: '24AAACB5678B1Z9',
        billingAddress: '321 Industrial Area, Ahmedabad, Gujarat 380001',
        tags: ['construction', 'large-projects'],
        status: 'Active',
        createdBy: user.id,
      },
    }),
  ]);

  console.log(`✅ Created ${clients.length} clients`);

  // ─── Create Products ───────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({
      data: {
        userId: user.id,
        businessId: business.id,
        name: 'Web Development Service',
        sku: 'SVC-WEB-001',
        hsnCode: '998314',
        description: 'Full-stack web development service',
        unitPrice: 50000,
        taxRate: 18,
        category: 'Services',
      },
    }),
    prisma.product.create({
      data: {
        userId: user.id,
        businessId: business.id,
        name: 'UI/UX Design Package',
        sku: 'SVC-UI-001',
        hsnCode: '998314',
        description: 'Complete UI/UX design for web and mobile',
        unitPrice: 30000,
        taxRate: 18,
        category: 'Services',
      },
    }),
    prisma.product.create({
      data: {
        userId: user.id,
        businessId: business.id,
        name: 'Hosting - Annual',
        sku: 'HOST-001',
        hsnCode: '998315',
        description: 'Cloud hosting - 1 year plan',
        unitPrice: 12000,
        taxRate: 18,
        category: 'Hosting',
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // ─── Create Services ───────────────────────────────────────────────
  const services = await Promise.all([
    prisma.service.create({
      data: {
        userId: user.id,
        businessId: business.id,
        name: 'Consulting',
        description: 'Business and technology consulting',
        hourlyRate: 2500,
        fixedRate: null,
      },
    }),
    prisma.service.create({
      data: {
        userId: user.id,
        businessId: business.id,
        name: 'SEO Optimization',
        description: 'Search engine optimization service',
        hourlyRate: null,
        fixedRate: 15000,
      },
    }),
  ]);

  console.log(`✅ Created ${services.length} services`);

  // ─── Create Invoices ───────────────────────────────────────────────
  const invoice1Items = [
    {
      type: 'Product',
      description: 'Web Development Service',
      hsnCode: '998314',
      quantity: 1,
      rate: 50000,
      discount: 0,
      taxRate: 18,
      amount: 50000,
    },
    {
      type: 'Product',
      description: 'UI/UX Design Package',
      hsnCode: '998314',
      quantity: 1,
      rate: 30000,
      discount: 10,
      taxRate: 18,
      amount: 27000,
    },
  ];

  const invoice1Subtotal = 77000;
  const invoice1Tax = (50000 * 0.18) + (27000 * 0.18);
  const invoice1Total = invoice1Subtotal + invoice1Tax;

  const invoice1 = await prisma.invoice.create({
    data: {
      userId: user.id,
      businessId: business.id,
      clientId: clients[0].id,
      invoiceNumber: 'ACM-00001',
      invoiceDate: new Date('2026-05-01'),
      dueDate: new Date('2026-06-01'),
      items: invoice1Items as any,
      subtotal: invoice1Subtotal,
      discountAmount: 0,
      taxAmount: Math.round(invoice1Tax * 100) / 100,
      total: Math.round(invoice1Total * 100) / 100,
      status: 'Paid',
      notes: 'Thank you for your business!',
      terms: 'Payment due within 30 days',
      createdBy: user.id,
    },
  });

  // Record payment for invoice1
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      userId: user.id,
      amount: Math.round(invoice1Total * 100) / 100,
      method: 'BankTransfer',
      reference: 'NEFT123456',
      status: 'Completed',
      paidAt: new Date('2026-05-15'),
    },
  });

  const invoice2Items = [
    {
      type: 'Product',
      description: 'Hosting - Annual',
      hsnCode: '998315',
      quantity: 2,
      rate: 12000,
      discount: 0,
      taxRate: 18,
      amount: 24000,
    },
  ];

  const invoice2Subtotal = 24000;
  const invoice2Tax = 24000 * 0.18;
  const invoice2Total = invoice2Subtotal + invoice2Tax;

  await prisma.invoice.create({
    data: {
      userId: user.id,
      businessId: business.id,
      clientId: clients[1].id,
      invoiceNumber: 'ACM-00002',
      invoiceDate: new Date('2026-05-15'),
      dueDate: new Date('2026-06-15'),
      items: invoice2Items as any,
      subtotal: invoice2Subtotal,
      discountAmount: 0,
      taxAmount: Math.round(invoice2Tax * 100) / 100,
      total: Math.round(invoice2Total * 100) / 100,
      status: 'Sent',
      notes: 'Annual hosting renewal',
      terms: 'Payment due within 30 days',
      createdBy: user.id,
    },
  });

  const invoice3Items = [
    {
      type: 'Service',
      description: 'Consulting - 10 hours',
      hsnCode: '998314',
      quantity: 10,
      rate: 2500,
      discount: 0,
      taxRate: 18,
      amount: 25000,
    },
  ];

  const invoice3Subtotal = 25000;
  const invoice3Tax = 25000 * 0.18;
  const invoice3Total = invoice3Subtotal + invoice3Tax;

  await prisma.invoice.create({
    data: {
      userId: user.id,
      businessId: business.id,
      clientId: clients[2].id,
      invoiceNumber: 'ACM-00003',
      invoiceDate: new Date('2026-04-01'),
      dueDate: new Date('2026-05-01'),
      items: invoice3Items as any,
      subtotal: invoice3Subtotal,
      discountAmount: 0,
      taxAmount: Math.round(invoice3Tax * 100) / 100,
      total: Math.round(invoice3Total * 100) / 100,
      status: 'Overdue',
      notes: 'Consulting services for Q1',
      terms: 'Payment due within 30 days',
      createdBy: user.id,
    },
  });

  console.log('✅ Created 3 invoices with payments');

  // ─── Create Estimates ──────────────────────────────────────────────
  await prisma.estimate.create({
    data: {
      userId: user.id,
      businessId: business.id,
      clientId: clients[0].id,
      estimateNumber: 'EST-00001',
      title: 'Mobile App Development',
      items: [
        {
          type: 'Product',
          description: 'Mobile App Development',
          hsnCode: '998314',
          quantity: 1,
          rate: 150000,
          discount: 0,
          taxRate: 18,
          amount: 150000,
        },
      ] as any,
      subtotal: 150000,
      taxAmount: 27000,
      total: 177000,
      status: 'Sent',
      expiryDate: new Date('2026-07-01'),
      notes: 'Estimate for iOS and Android app development',
      terms: 'Valid for 30 days',
    },
  });

  console.log('✅ Created 1 estimate');

  // ─── Create Expenses ───────────────────────────────────────────────
  await Promise.all([
    prisma.expense.create({
      data: {
        userId: user.id,
        businessId: business.id,
        category: 'Office Supplies',
        amount: 5000,
        description: 'Printer ink and stationery',
        date: new Date('2026-05-10'),
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        businessId: business.id,
        category: 'Software',
        amount: 15000,
        description: 'Annual software licenses',
        date: new Date('2026-05-05'),
        taxAmount: 2700,
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        businessId: business.id,
        category: 'Travel',
        amount: 8000,
        description: 'Client meeting travel expenses',
        date: new Date('2026-04-20'),
      },
    }),
  ]);

  console.log('✅ Created 3 expenses');

  // ─── Create Notifications ──────────────────────────────────────────
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to BillingBee!',
        message: 'Get started by creating your first invoice.',
        type: 'System',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Payment Received',
        message: 'Payment of INR 90,860 received for invoice ACM-00001.',
        type: 'Payment',
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Invoice Overdue',
        message: 'Invoice ACM-00003 is now overdue. Follow up with the client.',
        type: 'Reminder',
        isRead: false,
      },
    }),
  ]);

  console.log('✅ Created 3 notifications');

  // ─── Create Activity Logs ──────────────────────────────────────────
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      entity: 'Auth',
      method: 'POST',
      path: '/api/v1/auth/login',
      statusCode: 200,
      ip: '127.0.0.1',
    },
  });

  // ─── Create Status Logs ───────────────────────────────────────────
  await prisma.statusLog.create({
    data: {
      entity: 'Invoice',
      entityId: invoice1.id,
      action: 'STATUS_CHANGE',
      oldValue: 'Draft',
      newValue: 'Paid',
      description: 'Invoice ACM-00001 marked as Paid',
      changedBy: user.id,
    },
  });

  console.log('✅ Created activity and status logs');

  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🌱 Seed Complete!                          ║
  ║                                              ║
  ║   Demo User: demo@billingbee.com             ║
  ║   Password:  Demo@1234                       ║
  ║   Plan:     Professional                     ║
  ║                                              ║
  ║   1 Business, 3 Clients, 3 Invoices          ║
  ║   1 Estimate, 3 Expenses, 3 Products         ║
  ║   2 Services, 3 Notifications                ║
  ╚══════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
