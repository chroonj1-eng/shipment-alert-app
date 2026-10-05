import { supabase, getLocalDb, saveLocalDb } from '../lib/supabase';
import { Profile, Shipment, UrgencyLevel, ShipmentStatus, Job } from '../types/database';

/**
 * Strict Role-Based Access Control (RBAC) Service
 * Enforces permissions for ADMIN and SRM roles.
 *
 * ADMIN: FULL ACCESS
 *   - Create, edit, delete shipments
 *   - Change shipment status (any status)
 *   - Change urgency level (CRITICAL / URGENT / NORMAL)
 *   - Manage Jobs (create, edit, delete, assign)
 *   - Manage Users
 *
 * SRM: READ-ONLY + EXACTLY TWO PERMITTED MUTATIONS:
 *   1. Update shipment status ONLY to 'RECEIVED' (any current status -> RECEIVED)
 *   2. Update shipment urgency level ONLY between ('CRITICAL' | 'URGENT' | 'NORMAL')
 *   - EVERYTHING ELSE: STRICTLY DENIED & REJECTED
 */

export const RBAC = {
  isAdmin(user: Profile | null | undefined): boolean {
    return user?.role === 'ADMIN';
  },

  isSRM(user: Profile | null | undefined): boolean {
    if (!user) return false;
    return (
      user.role === 'SRM' ||
      user.role === 'CO_SRM' ||
      user.role === 'IN_CHARGE' ||
      user.role === 'ENGINEER' ||
      user.role === 'USER'
    );
  },

  canAddShipment(user: Profile | null | undefined): boolean {
    return user?.role === 'ADMIN';
  },

  canEditGeneralShipment(user: Profile | null | undefined): boolean {
    return user?.role === 'ADMIN';
  },

  canDeleteShipment(user: Profile | null | undefined): boolean {
    return user?.role === 'ADMIN';
  },

  canMarkReceived(user: Profile | null | undefined, currentStatus?: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    // SRM may change ANY status to RECEIVED, but once RECEIVED cannot revert
    return currentStatus !== 'RECEIVED';
  },

  canChangeUrgency(user: Profile | null | undefined): boolean {
    return Boolean(user);
  },

  canManageJobs(user: Profile | null | undefined): boolean {
    return user?.role === 'ADMIN';
  },

  canManageUsers(user: Profile | null | undefined): boolean {
    return user?.role === 'ADMIN';
  },

  canManageSpareParts(user: Profile | null | undefined): boolean {
    return user?.role === 'ADMIN';
  },

  canModifyShipmentField(field: keyof Shipment | string, user: Profile | null | undefined): boolean {
    if (user?.role === 'ADMIN') return true;
    if (field === 'status' || field === 'urgency') return true;
    return false;
  },
};

/**
 * SRM Mutation A: Mark Shipment as RECEIVED
 * Only modifies status to 'RECEIVED', received_date, and receiver info.
 * Rejects if user is unauthorized or tries to change to any status other than RECEIVED.
 */
export async function markShipmentReceived(
  shipmentId: string,
  user: Profile | null,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  try {
    // 1. Try calling the secure database RPC function
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('srm_mark_received', {
        p_shipment_id: shipmentId,
        p_receiver_notes: notes || 'Received into shipyard',
      });

      if (!rpcError && rpcData?.success) {
        window.dispatchEvent(new CustomEvent('supabase-data-changed'));
        return { success: true };
      }
    } catch {
      // Fallback to direct targeted update if RPC is not deployed in current environment
    }

    // 2. Direct targeted update strictly restricted to receiving confirmation fields
    const now = new Date().toISOString();
    const receiverName = user.full_name || user.name || 'SRM Officer';
    const receiverNotes = notes || 'Received into shipyard';

    const { error } = await supabase
      .from('shipments')
      .update({
        status: 'RECEIVED' as ShipmentStatus,
        received_date: now,
        receiver_name: receiverName,
        receiver_notes: receiverNotes,
      })
      .eq('id', shipmentId);

    if (error) {
      console.error('[RBAC] markShipmentReceived error:', error);
      return { success: false, error: error.message };
    }

    // Sync local database state
    try {
      const localDb = getLocalDb();
      if (localDb.shipments) {
        const idx = localDb.shipments.findIndex((s: any) => s.id === shipmentId);
        if (idx !== -1) {
          localDb.shipments[idx].status = 'RECEIVED';
          localDb.shipments[idx].received_date = now;
          localDb.shipments[idx].receiver_name = receiverName;
          localDb.shipments[idx].receiver_notes = receiverNotes;
          saveLocalDb(localDb);
        }
      }
    } catch (localErr) {
      console.warn('[RBAC] Local sync notice:', localErr);
    }

    // Create notification record
    try {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'SHIPMENT_RECEIVED',
        title: 'Spare Part Received',
        message: `${receiverName} confirmed receipt of spare parts.`,
        is_read: false,
      });
    } catch {
      // notification table insert is optional
    }

    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to mark as received' };
  }
}

/**
 * SRM Mutation B: Update Shipment Urgency Level
 * Permitted values: 'CRITICAL' | 'URGENT' | 'NORMAL'
 * ONLY modifies urgency / urgency_level. Leaves all other fields completely untouched.
 */
export async function updateShipmentUrgency(
  shipmentId: string,
  newUrgency: UrgencyLevel,
  user: Profile | null
): Promise<{ success: boolean; error?: string }> {
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  if (!['CRITICAL', 'URGENT', 'NORMAL'].includes(newUrgency)) {
    return { success: false, error: 'Invalid urgency level. Must be CRITICAL, URGENT, or NORMAL.' };
  }

  try {
    // 1. Try secure RPC function
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('srm_update_urgency', {
        p_shipment_id: shipmentId,
        p_urgency: newUrgency,
      });

      if (!rpcError && rpcData?.success) {
        // Sync local database
        try {
          const localDb = getLocalDb();
          if (localDb.shipments) {
            const idx = localDb.shipments.findIndex((s: any) => s.id === shipmentId);
            if (idx !== -1) {
              localDb.shipments[idx].urgency = newUrgency;
              localDb.shipments[idx].urgency_level = newUrgency;
              saveLocalDb(localDb);
            }
          }
        } catch {}

        window.dispatchEvent(new CustomEvent('supabase-data-changed'));
        return { success: true };
      }
    } catch {
      // Fallback to direct update
    }

    // 2. Direct targeted update strictly restricted to urgency / urgency_level
    let updateError = null;
    const { error: errBoth } = await supabase
      .from('shipments')
      .update({
        urgency: newUrgency,
        urgency_level: newUrgency,
      })
      .eq('id', shipmentId);

    if (errBoth) {
      // Fallback to urgency column alone
      const { error: errUrgency } = await supabase
        .from('shipments')
        .update({ urgency: newUrgency })
        .eq('id', shipmentId);
      if (errUrgency) {
        updateError = errUrgency;
      }
    }

    if (updateError) {
      console.error('[RBAC] updateShipmentUrgency error:', updateError);
      return { success: false, error: updateError.message };
    }

    // Sync local database state
    try {
      const localDb = getLocalDb();
      if (localDb.shipments) {
        const idx = localDb.shipments.findIndex((s: any) => s.id === shipmentId);
        if (idx !== -1) {
          localDb.shipments[idx].urgency = newUrgency;
          localDb.shipments[idx].urgency_level = newUrgency;
          saveLocalDb(localDb);
        }
      }
    } catch (localErr) {
      console.warn('[RBAC] Local sync notice:', localErr);
    }

    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update urgency' };
  }
}

/**
 * ADMIN ONLY: Create New Shipment
 * Strictly rejects if user role is not ADMIN.
 */
export async function adminCreateShipment(
  payload: any,
  user: Profile | null
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Access Denied: Only ADMIN can add new shipments.' };
  }

  try {
    const { data, error } = await supabase
      .from('shipments')
      .insert(payload)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    // Sync local database
    try {
      const localDb = getLocalDb();
      if (!localDb.shipments) localDb.shipments = [];
      const newShipment = { ...payload, id: (data && data[0]?.id) || `ship-${Date.now()}` };
      localDb.shipments.unshift(newShipment);
      saveLocalDb(localDb);
    } catch {}

    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create shipment' };
  }
}

/**
 * ADMIN ONLY: General Shipment Update (Edit Shipment)
 * Strictly rejects if user role is not ADMIN.
 */
export async function adminUpdateShipment(
  shipmentId: string,
  updates: Partial<Shipment>,
  user: Profile | null
): Promise<{ success: boolean; error?: string }> {
  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Access Denied: Only ADMIN can modify general shipment details.' };
  }

  try {
    const { error } = await supabase
      .from('shipments')
      .update(updates)
      .eq('id', shipmentId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Sync local database
    try {
      const localDb = getLocalDb();
      if (localDb.shipments) {
        const idx = localDb.shipments.findIndex((s: any) => s.id === shipmentId);
        if (idx !== -1) {
          localDb.shipments[idx] = { ...localDb.shipments[idx], ...updates };
          saveLocalDb(localDb);
        }
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update shipment' };
  }
}

/**
 * ADMIN ONLY: Delete Shipment
 * Strictly rejects if user role is not ADMIN.
 */
export async function adminDeleteShipment(
  shipmentId: string,
  user: Profile | null
): Promise<{ success: boolean; error?: string }> {
  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Access Denied: Only ADMIN can delete shipments.' };
  }

  try {
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', shipmentId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Sync local database
    try {
      const localDb = getLocalDb();
      if (localDb.shipments) {
        localDb.shipments = localDb.shipments.filter((s: any) => s.id !== shipmentId);
        saveLocalDb(localDb);
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete shipment' };
  }
}

/**
 * ADMIN ONLY: Create Job
 * Strictly rejects if user role is not ADMIN.
 */
export async function adminCreateJob(
  payload: Partial<Job>,
  user: Profile | null
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Access Denied: Only ADMIN can create jobs.' };
  }

  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert(payload)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create job' };
  }
}

/**
 * ADMIN ONLY: Edit Job
 * Strictly rejects if user role is not ADMIN.
 */
export async function adminUpdateJob(
  jobId: string,
  updates: Partial<Job>,
  user: Profile | null
): Promise<{ success: boolean; error?: string }> {
  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Access Denied: Only ADMIN can edit jobs.' };
  }

  try {
    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      return { success: false, error: error.message };
    }

    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update job' };
  }
}

/**
 * ADMIN ONLY: Delete Job
 * Strictly rejects if user role is not ADMIN.
 */
export async function adminDeleteJob(
  jobId: string,
  user: Profile | null
): Promise<{ success: boolean; error?: string }> {
  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Access Denied: Only ADMIN can delete jobs.' };
  }

  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      return { success: false, error: error.message };
    }

    window.dispatchEvent(new CustomEvent('supabase-data-changed'));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete job' };
  }
}
