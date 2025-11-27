/**
 * @file app/api/cloud/databases/route.ts
 * @description Database instance management API endpoints
 * @created 2025-11-17
 * 
 * OVERVIEW:
 * Handles per-customer database instance creation and retrieval for Technology/Software
 * companies offering managed database services. Tracks resource allocations, usage metering,
 * tier-based defaults, billing calculations, and auto-scaling recommendations.
 * 
 * ENDPOINTS:
 * - POST /api/cloud/databases - Create new database instance for customer
 * - GET /api/cloud/databases - List database instances with filtering
 * 
 * BUSINESS LOGIC:
 * - Customer tiers: Startup (2 vCPU, 50 GB), Enterprise (8 vCPU, 500 GB), Government (32 vCPU, 2000 GB)
 * - Database types: SQL, NoSQL, Graph, TimeSeries
 * - Billing: $200 base + vCPU × $20 + storage × $0.50
 * - Volume discounts: 10% off > $1k/month, 20% off > $10k/month
 * - Auto-scaling: Trigger at 80% overall utilization
 * - Replication: 1/3/5 replicas for high availability
 * 
 * IMPLEMENTATION NOTES:
 * - 50% code reuse from E-Commerce cloud customer API
 * - New tier-based allocation logic
 * - New volume discount calculation
 * - Borrow auth/validation patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/getServerSession';
import dbConnect from '@/lib/db/mongodb';
import DatabaseInstance from '@/lib/db/models/DatabaseInstance';
import CloudServer from '@/lib/db/models/CloudServer';
import Company from '@/lib/db/models/Company';
import { Types } from 'mongoose';

/**
 * POST /api/cloud/databases
 * 
 * Create new database instance for customer
 * 
 * Request Body:
 * {
 *   cloudServer: string;              // CloudServer ID (Database type)
 *   customer: string;                 // Customer company ID
 *   tier?: 'Startup' | 'Enterprise' | 'Government';
 *   databaseType?: 'SQL' | 'NoSQL' | 'Graph' | 'TimeSeries';
 *   replicationFactor?: 1 | 3 | 5;
 *   backupRetention?: number;         // Days
 *   connectionPoolSize?: number;
 *   indexingStrategy?: 'Standard' | 'Full-text' | 'Spatial';
 *   allocatedVCpu?: number;
 *   allocatedStorage?: number;        // GB
 * }
 * 
 * Response:
 * {
 *   database: IDatabaseInstance;
 *   allocation: {
 *     vCpu: number;
 *     storage: number;
 *     connections: number;
 *   };
 *   billing: {
 *     monthlyBill: number;
 *     baseBill: number;
 *     discount: number;
 *   };
 *   tierDefaults: object;
 *   message: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const {
      cloudServer: cloudServerId,
      customer: customerId,
      tier,
      databaseType,
      replicationFactor,
      backupRetention,
      connectionPoolSize,
      indexingStrategy,
      allocatedVCpu,
      allocatedStorage,
    } = body;

    // Validate required fields
    if (!cloudServerId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields: cloudServer, customer' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify cloud server exists and user owns it
    const cloudServer = await CloudServer.findById(cloudServerId).populate('company');
    if (!cloudServer) {
      return NextResponse.json({ error: 'Cloud server not found' }, { status: 404 });
    }

    const company = await Company.findById(cloudServer.company);
    if (!company || company.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this cloud server' }, { status: 403 });
    }

    // Verify cloud server is Database type
    if (cloudServer.type !== 'Database') {
      return NextResponse.json(
        { error: 'Cloud server must be Database type', actualType: cloudServer.type },
        { status: 400 }
      );
    }

    // Verify customer company exists
    const customer = await Company.findById(customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer company not found' }, { status: 404 });
    }

    // Get tier-based defaults
    const selectedTier = tier || 'Startup';
    const tierDefaults = (DatabaseInstance as any).getDefaultAllocation(selectedTier);

    // Use provided values or tier defaults
    const finalVCpu = allocatedVCpu !== undefined ? allocatedVCpu : tierDefaults.vCpu;
    const finalStorage = allocatedStorage !== undefined ? allocatedStorage : tierDefaults.storage;
    const finalConnectionPoolSize = connectionPoolSize !== undefined ? connectionPoolSize : tierDefaults.connectionPoolSize;
    const finalReplicationFactor = replicationFactor !== undefined ? replicationFactor : tierDefaults.replicationFactor;
    const finalBackupRetention = backupRetention !== undefined ? backupRetention : tierDefaults.backupRetention;

    // Create database instance
    const database = await DatabaseInstance.create({
      cloudServer: new Types.ObjectId(cloudServerId),
      customer: new Types.ObjectId(customerId),
      tier: selectedTier,
      databaseType: databaseType || 'SQL',
      replicationFactor: finalReplicationFactor,
      backupRetention: finalBackupRetention,
      connectionPoolSize: finalConnectionPoolSize,
      indexingStrategy: indexingStrategy || 'Standard',
      allocatedVCpu: finalVCpu,
      allocatedStorage: finalStorage,
      usedVCpu: 0,
      usedStorage: 0,
      peakVCpu: 0,
      peakStorage: 0,
      currentConnections: 0,
      peakConnections: 0,
      autoScalingEnabled: true,
      scaleUpThreshold: 80,
      paymentStatus: 'Current',
    });

    // Calculate monthly bill
    const billingResult = await database.calculateMonthlyBill();
    database.monthlyBill = billingResult.finalBill;
    await database.save();

    // Update cloud server allocation
    await cloudServer.updateOne({
      $inc: {
        allocatedCapacity: 1, // One database instance allocated
        customerCount: 1,
      },
    });

    return NextResponse.json({
      database,
      allocation: {
        vCpu: finalVCpu,
        storage: finalStorage,
        connections: finalConnectionPoolSize,
      },
      billing: {
        monthlyBill: billingResult.finalBill,
        baseBill: billingResult.baseBill,
        discount: billingResult.discount,
      },
      tierDefaults,
      message: `Database instance created successfully. Tier: ${selectedTier}, Type: ${database.databaseType}, Monthly bill: $${billingResult.finalBill.toFixed(2)}`,
    });
  } catch (error) {
    console.error('Error creating database instance:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cloud/databases
 * 
 * List database instances with filtering
 * 
 * Query Parameters:
 * - cloudServer?: string - Filter by cloud server
 * - customer?: string - Filter by customer
 * 
 * Response:
 * {
 *   databases: IDatabaseInstance[];
 *   cloudServer?: object;
 *   customer?: object;
 *   aggregatedMetrics: {
 *     totalVCpu: number;
 *     totalStorage: number;
 *     totalRevenue: number;
 *     avgUtilization: number;
 *   };
 *   recommendations: string[];
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cloudServerId = searchParams.get('cloudServer');
    const customerId = searchParams.get('customer');

    if (!cloudServerId && !customerId) {
      return NextResponse.json({ error: 'cloudServer or customer parameter is required' }, { status: 400 });
    }

    await dbConnect();

    // Build query filter
    const filter: any = { active: true };
    if (cloudServerId) filter.cloudServer = cloudServerId;
    if (customerId) filter.customer = customerId;

    // Fetch database instances
    const databases = await DatabaseInstance.find(filter)
      .populate('cloudServer')
      .populate('customer')
      .sort({ monthlyBill: -1 });

    // Verify ownership
    if (databases.length > 0) {
      const firstDb = databases[0];
      const cloudServer = firstDb.cloudServer as any;
      const company = await Company.findById(cloudServer.company);

      if (!company || company.owner.toString() !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized: You do not own these databases' }, { status: 403 });
      }
    }

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      totalVCpu: databases.reduce((sum, db) => sum + db.allocatedVCpu, 0),
      totalStorage: databases.reduce((sum, db) => sum + db.allocatedStorage, 0),
      totalRevenue: databases.reduce((sum, db) => sum + db.monthlyBill, 0),
      avgUtilization: 0,
    };

    // Calculate weighted average utilization
    if (databases.length > 0) {
      const totalUtil = databases.reduce((sum, db) => sum + db.overallUtilization, 0);
      aggregatedMetrics.avgUtilization = Math.round((totalUtil / databases.length) * 100) / 100;
    }

    // Generate recommendations
    const recommendations: string[] = [];

    const highUtilizationDbs = databases.filter((db) => db.overallUtilization > 80);
    if (highUtilizationDbs.length > 0) {
      recommendations.push(
        `${highUtilizationDbs.length} database(s) above 80% utilization. Enable auto-scaling or manually expand capacity.`
      );
    }

    const overdueDbs = databases.filter((db) => db.paymentStatus === 'Overdue');
    if (overdueDbs.length > 0) {
      recommendations.push(
        `${overdueDbs.length} database(s) with overdue payments. Review billing status and contact customers.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('All database instances operating normally.');
    }

    return NextResponse.json({
      databases,
      aggregatedMetrics,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching database instances:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
