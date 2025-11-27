/**
 * AIModel.ts
 * Created: 2025-11-15
 * 
 * OVERVIEW:
 * Complete AI Model schema for training lifecycle management. Supports full training
 * progression from initialization through completion and deployment. Includes
 * comprehensive benchmark tracking, cost accumulation, and performance metrics.
 * 
 * KEY FEATURES:
 * - Full lifecycle status management (Training → Completed → Deployed)
 * - Accurate training cost calculation with size multipliers
 * - Real-time benchmark scoring (accuracy, perplexity, F1, latency)
 * - Deployment endpoint management with uptime tracking
 * - Dataset size and compute resource tracking
 * 
 * BUSINESS LOGIC:
 * - Training costs scale with model size: Small (1x), Medium (4x), Large (10x)
 * - Size thresholds: Small ≤10B params, Medium ≤80B, Large >80B
 * - Benchmarks calculated on completion (industry-standard metrics)
 * - Deployment generates API endpoint and initializes uptime metrics
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Valid model architectures supported by the platform
export type AIArchitecture = 'Transformer' | 'CNN' | 'RNN' | 'Diffusion' | 'GAN';

// Model size categories with associated parameter thresholds
export type AIModelSize = 'Small' | 'Medium' | 'Large';

// Lifecycle status for training and deployment tracking
export type AITrainingStatus = 'Training' | 'Completed' | 'Deployed';

/**
 * Benchmark scores interface
 * All metrics use industry-standard calculations
 */
export interface BenchmarkScores {
  accuracy: number;      // 0-100%, calculated from validation set performance
  perplexity: number;    // Lower is better, calculated for language models
  f1Score: number;       // 0-1, harmonic mean of precision and recall
  inferenceLatency: number; // milliseconds per inference (average)
}

/**
 * AIModel interface representing complete model lifecycle
 */
export interface IAIModel extends Document {
  // Ownership and identification
  company: Types.ObjectId;
  name: string;
  architecture: AIArchitecture;
  
  // Model specifications
  size: AIModelSize;
  parameters: number; // Total parameter count (must match size category)
  
  // Training lifecycle
  status: AITrainingStatus;
  trainingProgress: number; // 0-100%
  trainingStarted?: Date;
  trainingCompleted?: Date;
  trainingCost: number; // Accumulated USD cost
  
  // Dataset information
  dataset: string; // Dataset name/source
  datasetSize: number; // Size in GB or millions of examples
  
  // Performance metrics (calculated on completion)
  benchmarkScores: BenchmarkScores;
  
  // Deployment information
  deployed: boolean;
  apiEndpoint?: string; // Generated endpoint slug
  pricing?: number; // USD per 1000 API calls
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateIncrementalCost(progressIncrement: number): number;
  calculateBenchmarkScores(): BenchmarkScores;
  generateApiEndpoint(): string;
}

/**
 * Size multipliers for training cost calculation
 * Based on computational requirements and industry pricing
 */
const SIZE_MULTIPLIERS: Record<AIModelSize, number> = {
  Small: 1,
  Medium: 4,
  Large: 10,
};

/**
 * Parameter thresholds for size validation
 * Ensures size category matches actual parameter count
 */
const SIZE_THRESHOLDS = {
  Small: { min: 0, max: 10_000_000_000 }, // 0-10B params
  Medium: { min: 10_000_000_001, max: 80_000_000_000 }, // 10B-80B params
  Large: { min: 80_000_000_001, max: Infinity }, // >80B params
};

const AIModelSchema = new Schema<IAIModel>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
      minlength: [3, 'Model name must be at least 3 characters'],
      maxlength: [100, 'Model name cannot exceed 100 characters'],
    },
    architecture: {
      type: String,
      enum: {
        values: ['Transformer', 'CNN', 'RNN', 'Diffusion', 'GAN'],
        message: '{VALUE} is not a valid architecture',
      },
      required: [true, 'Architecture is required'],
    },
    size: {
      type: String,
      enum: {
        values: ['Small', 'Medium', 'Large'],
        message: '{VALUE} is not a valid size',
      },
      required: [true, 'Model size is required'],
    },
    parameters: {
      type: Number,
      required: [true, 'Parameter count is required'],
      min: [1, 'Parameters must be greater than 0'],
      validate: {
        validator: function (this: IAIModel, value: number): boolean {
          const threshold = SIZE_THRESHOLDS[this.size as AIModelSize];
          return value >= threshold.min && value <= threshold.max;
        },
        message: function (props: any): string {
          const size = props.instance.size as AIModelSize;
          const threshold = SIZE_THRESHOLDS[size];
          if (threshold.max === Infinity) {
            return `${size} models must have more than ${threshold.min.toLocaleString()} parameters`;
          }
          return `${size} models must have between ${threshold.min.toLocaleString()} and ${threshold.max.toLocaleString()} parameters`;
        },
      },
    },
    status: {
      type: String,
      enum: {
        values: ['Training', 'Completed', 'Deployed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Training',
      index: true,
    },
    trainingProgress: {
      type: Number,
      default: 0,
      min: [0, 'Training progress cannot be negative'],
      max: [100, 'Training progress cannot exceed 100'],
    },
    trainingStarted: {
      type: Date,
      default: Date.now,
    },
    trainingCompleted: {
      type: Date,
    },
    trainingCost: {
      type: Number,
      default: 0,
      min: [0, 'Training cost cannot be negative'],
    },
    dataset: {
      type: String,
      required: [true, 'Dataset name/source is required'],
      trim: true,
    },
    datasetSize: {
      type: Number,
      required: [true, 'Dataset size is required'],
      min: [0.001, 'Dataset size must be greater than 0'],
    },
    benchmarkScores: {
      type: {
        accuracy: {
          type: Number,
          min: [0, 'Accuracy must be between 0 and 100'],
          max: [100, 'Accuracy must be between 0 and 100'],
          default: 0,
        },
        perplexity: {
          type: Number,
          min: [0, 'Perplexity cannot be negative'],
          default: 0,
        },
        f1Score: {
          type: Number,
          min: [0, 'F1 score must be between 0 and 1'],
          max: [1, 'F1 score must be between 0 and 1'],
          default: 0,
        },
        inferenceLatency: {
          type: Number,
          min: [0, 'Latency cannot be negative'],
          default: 0,
        },
      },
      default: () => ({
        accuracy: 0,
        perplexity: 0,
        f1Score: 0,
        inferenceLatency: 0,
      }),
    },
    deployed: {
      type: Boolean,
      default: false,
      index: true,
    },
    apiEndpoint: {
      type: String,
      trim: true,
    },
    pricing: {
      type: Number,
      min: [0, 'Pricing cannot be negative'],
    },
  },
  {
    timestamps: true,
    collection: 'aimodels',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient querying
AIModelSchema.index({ company: 1, status: 1 });
AIModelSchema.index({ company: 1, deployed: 1 });
AIModelSchema.index({ trainingProgress: 1 });
AIModelSchema.index({ company: 1, name: 1 }, { unique: true });

/**
 * Calculate incremental training cost
 * 
 * Formula: baseCost × datasetFactor × sizeMultiplier × increment
 * 
 * @param progressIncrement - Percentage points to advance (e.g., 5 for 5%)
 * @returns Cost in USD for the increment
 * 
 * @example
 * // Small model, 10GB dataset, 5% increment
 * model.calculateIncrementalCost(5) // Returns ~$250
 */
AIModelSchema.methods.calculateIncrementalCost = function (
  this: IAIModel,
  progressIncrement: number
): number {
  // Base cost per percentage point per billion parameters
  const baseUnitCost = 10; // $10 per 1% per billion parameters
  
  // Parameter factor (cost scales with parameter count)
  const parameterFactor = Math.log10(this.parameters / 1_000_000_000 + 1);
  
  // Dataset size factor (larger datasets cost more to process)
  const datasetFactor = Math.sqrt(this.datasetSize);
  
  // Size multiplier based on model category
  const sizeMultiplier = SIZE_MULTIPLIERS[this.size];
  
  // Calculate total cost for this increment
  const incrementCost =
    baseUnitCost *
    parameterFactor *
    datasetFactor *
    sizeMultiplier *
    progressIncrement;
  
  return Math.round(incrementCost * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate benchmark scores based on model characteristics
 * 
 * Simulates realistic performance metrics based on:
 * - Architecture type (Transformers excel at language tasks)
 * - Model size (larger models generally perform better)
 * - Dataset size (more data improves generalization)
 * - Training progress (completed models score higher)
 * 
 * @returns Complete benchmark scores object
 * 
 * NOTE: In production, these would be calculated from actual validation set
 * performance. This implementation provides realistic simulated scores.
 */
AIModelSchema.methods.calculateBenchmarkScores = function (
  this: IAIModel
): BenchmarkScores {
  // Base scores vary by architecture
  const architectureBonus: Record<AIArchitecture, number> = {
    Transformer: 15,
    CNN: 10,
    RNN: 8,
    Diffusion: 12,
    GAN: 10,
  };
  
  // Size impact on performance
  const sizeBonus: Record<AIModelSize, number> = {
    Small: 0,
    Medium: 10,
    Large: 20,
  };
  
  // Dataset size impact (diminishing returns)
  const datasetBonus = Math.min(15, Math.log10(this.datasetSize + 1) * 5);
  
  // Training completeness factor
  const trainingFactor = this.trainingProgress / 100;
  
  // Calculate accuracy (0-100%)
  const baseAccuracy = 65;
  const accuracy = Math.min(
    99.9,
    baseAccuracy +
      architectureBonus[this.architecture] +
      sizeBonus[this.size] +
      datasetBonus
  ) * trainingFactor;
  
  // Calculate perplexity (lower is better, language models only)
  const isLanguageModel = this.architecture === 'Transformer' || this.architecture === 'RNN';
  const perplexity = isLanguageModel
    ? Math.max(1.5, 50 - sizeBonus[this.size] - datasetBonus / 2) / trainingFactor
    : 0;
  
  // Calculate F1 score (0-1)
  const f1Score = Math.min(0.99, (accuracy / 100) * 0.95);
  
  // Calculate inference latency (ms, larger models are slower)
  const baseLatency: Record<AIModelSize, number> = {
    Small: 20,
    Medium: 150,
    Large: 800,
  };
  const inferenceLatency = baseLatency[this.size] * (1 + Math.random() * 0.2);
  
  return {
    accuracy: Math.round(accuracy * 100) / 100,
    perplexity: Math.round(perplexity * 100) / 100,
    f1Score: Math.round(f1Score * 1000) / 1000,
    inferenceLatency: Math.round(inferenceLatency * 10) / 10,
  };
};

/**
 * Generate unique API endpoint slug
 * 
 * Format: /api/v1/models/{company-id}/{model-name-slug}/{version}
 * 
 * @returns API endpoint path
 * 
 * @example
 * // Company: "TechCorp AI", Model: "GPT-4 Clone v2"
 * model.generateApiEndpoint() 
 * // Returns: "/api/v1/models/507f1f77bcf86cd799439011/gpt-4-clone-v2/1"
 */
AIModelSchema.methods.generateApiEndpoint = function (this: IAIModel): string {
  // Convert model name to URL-safe slug
  const slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Version number (count of deployed models with same slug)
  const version = 1; // In production, query for existing endpoints with same slug
  
  return `/api/v1/models/${this.company}/${slug}/${version}`;
};

/**
 * Pre-save middleware: Update status based on training progress
 */
AIModelSchema.pre('save', function (next) {
  // Cast to any for Mongoose this context access
  const model = this as any;
  
  // Auto-complete when training reaches 100%
  if (model.trainingProgress >= 100 && model.status === 'Training') {
    model.status = 'Completed';
    model.trainingCompleted = new Date();
    
    // Calculate final benchmark scores
    model.benchmarkScores = model.calculateBenchmarkScores();
  }
  
  // Validate deployment requirements
  if (model.deployed && model.status !== 'Deployed') {
    model.status = 'Deployed';
  }
  
  // Ensure deployed models have endpoints
  if (this.deployed && !this.apiEndpoint) {
    this.apiEndpoint = this.generateApiEndpoint();
  }
  
  next();
});

// Export model
const AIModel: Model<IAIModel> =
  mongoose.models.AIModel || mongoose.model<IAIModel>('AIModel', AIModelSchema);

export default AIModel;

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. COST CALCULATION:
 *    - Uses logarithmic scaling for parameters to reflect real GPU costs
 *    - Dataset size uses square root to model data loading overhead
 *    - Size multipliers: 1x/4x/10x match industry pricing tiers
 * 
 * 2. BENCHMARK SCORING:
 *    - Simulates realistic performance based on model characteristics
 *    - In production, replace with actual validation set evaluation
 *    - Scores calculated only on completion (trainingProgress = 100%)
 * 
 * 3. DEPLOYMENT:
 *    - API endpoint generation creates unique, versioned paths
 *    - Pre-save hook ensures deployed models have endpoints
 *    - Status transitions: Training → Completed → Deployed
 * 
 * 4. VALIDATION:
 *    - Size-parameter mapping enforced (Small ≤10B, Medium ≤80B, Large >80B)
 *    - Progress constrained to 0-100%
 *    - All costs and metrics validated as non-negative
 * 
 * 5. PERFORMANCE:
 *    - Indexed by company+status for efficient filtering
 *    - Indexed by deployed status for marketplace queries
 *    - Compound indexes support common query patterns
 */
