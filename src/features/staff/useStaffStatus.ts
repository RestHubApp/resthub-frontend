import { useMutation, useQueryClient } from '@tanstack/react-query'

import { changeStaffStatus } from '@/api/staff'
import type { StaffResponse } from '@/api/types'
import { saveStaffMember } from './staffList'

/** Activa o desactiva una cuenta del personal y deja la lista al día. */
export function useStaffStatus(account: StaffResponse) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => changeStaffStatus(account.id, !account.is_active),
    onSuccess: (updatedAccount) => {
      saveStaffMember(queryClient, updatedAccount)
    },
  })
}
