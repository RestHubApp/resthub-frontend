import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createStaff } from '@/api/staff'
import { saveStaffMember } from './staffList'
import { createPayload, type CreateStaffValues } from './staffSchema'

/** La mutación que da de alta una cuenta: la suma a la lista del personal y avisa con `onDone`. */
export function useCreateStaff(onDone: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: CreateStaffValues) => createStaff(createPayload(values)),
    onSuccess: (account) => {
      saveStaffMember(queryClient, account)
      onDone()
    },
  })
}
