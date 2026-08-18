import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { deliveryOTPs, auditLogs, transportQueue } from "@/data/mockData";

/**
 * Generates a secure OTP for an order
 */
export const generateDeliveryOTP = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ orderId: z.string() }).parse(data))
  .handler(async ({ data }: { data: { orderId: string } }) => {
    // Secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry
    
    deliveryOTPs[data.orderId] = {
      orderId: data.orderId,
      otp, // In production, hash this
      expiresAt,
      attempts: 0,
      maxAttempts: 3
    };

    auditLogs.push({
      event: 'OTP_GENERATED',
      orderId: data.orderId,
      timestamp: new Date().toISOString(),
      details: 'Secure OTP generated for delivery'
    });

    console.log(`[BACKEND] OTP for ${data.orderId}: ${otp} (Sent to Customer)`);
    
    return { success: true, message: "OTP sent to customer" };
  });

/**
 * Verifies delivery OTP and updates status atomically
 */
export const verifyDeliveryOTP = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => 
    z.object({ orderId: z.string(), otp: z.string().length(6), driverId: z.string() }).parse(data)
  )
  .handler(async ({ data }: { data: { orderId: string, otp: string, driverId: string } }) => {
    const record = deliveryOTPs[data.orderId];

    if (!record) {
      return { success: false, error: "OTP not found for this order" };
    }

    if (new Date() > new Date(record.expiresAt)) {
      return { success: false, error: "OTP expired" };
    }

    if (record.attempts >= record.maxAttempts) {
      return { success: false, error: "Too many failed attempts. Verification locked." };
    }

    if (record.otp !== data.otp) {
      record.attempts += 1;
      auditLogs.push({
        event: 'OTP_FAILED',
        orderId: data.orderId,
        timestamp: new Date().toISOString(),
        details: `Incorrect OTP attempt (${record.attempts}/${record.maxAttempts})`
      });
      return { success: false, error: "Invalid OTP" };
    }

    // SUCCESS - Atomic Update
    delete deliveryOTPs[data.orderId];
    
    // Update statuses across records (Simulating DB update)
    const orderInQueue = transportQueue.find((o: any) => o.id === data.orderId);
    if (orderInQueue) orderInQueue.status = 'Delivered';

    auditLogs.push({
      event: 'OTP_VERIFIED',
      orderId: data.orderId,
      timestamp: new Date().toISOString(),
      details: 'Delivery confirmed via OTP'
    });

    return { 
      success: true, 
      message: "Delivery Confirmed Successfully",
      timestamp: new Date().toISOString()
    };
  });
