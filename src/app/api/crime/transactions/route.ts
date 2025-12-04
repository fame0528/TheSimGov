import { transactionPurchaseSchema } from "@/lib/validations/crime";
import { createSuccessResponse, createErrorResponse, ErrorCode } from "@/lib/utils/apiResponse";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const status = url.searchParams.get("status");
  return createSuccessResponse([], { userId, status });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = transactionPurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return createErrorResponse(parsed.error.message, ErrorCode.VALIDATION_ERROR, 422);
  }
  const created = {
    id: "mock-transaction-id",
    deliveryStatus: "Scheduled",
    escrowStatus: "Pending",
    totalPrice: 0,
    ...parsed.data,
  };
  return createSuccessResponse(created, {});
}
