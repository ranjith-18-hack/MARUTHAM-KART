import { transportVehicles, transportDrivers, OutboundOrder, TransportVehicle, TransportDriver } from "@/data/mockData";

export interface AllocationResult {
  vehicle: TransportVehicle | null;
  driver: TransportDriver | null;
  reason: string;
}

/**
 * Automatically allocates the smallest suitable vehicle and an available driver for an order.
 */
export function autoAllocateTransport(order: OutboundOrder): AllocationResult {
  // 1. Find suitable vehicles (Available, sufficient weight and volume)
  const suitableVehicles = transportVehicles
    .filter(v => v.status === 'Available')
    .filter(v => v.maxWeight >= order.weight)
    .filter(v => v.maxVolume >= order.volume)
    .sort((a, b) => a.maxWeight - b.maxWeight); // Smallest capacity first

  const selectedVehicle = suitableVehicles[0];

  if (!selectedVehicle) {
    return {
      vehicle: null,
      driver: null,
      reason: "NO SUITABLE VEHICLE AVAILABLE (Capacity or Availability issues)"
    };
  }

  // 2. Find an available driver
  // If the vehicle already has an assigned driver who is available, prefer them
  let selectedDriver = transportDrivers.find(d => 
    d.id === selectedVehicle.assignedDriver && d.availability === 'Available'
  );

  // If no specifically assigned driver is available, pick any available driver
  if (!selectedDriver) {
    selectedDriver = transportDrivers.find(d => d.availability === 'Available');
  }

  if (!selectedDriver) {
    return {
      vehicle: selectedVehicle,
      driver: null,
      reason: `Vehicle ${selectedVehicle.number} found, but no available driver.`
    };
  }

  return {
    vehicle: selectedVehicle,
    driver: selectedDriver,
    reason: `Smallest suitable vehicle (${selectedVehicle.type}, ${selectedVehicle.capacity}) selected for ${order.weight}kg load.`
  };
}
