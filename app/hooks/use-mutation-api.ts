import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

// Thin wrapper so every write goes through one place (errors are toasted by axiosClient)
export const useMutationApi = <TData, TVariables, TError = Error>(
  options: UseMutationOptions<TData, TError, TVariables>
) => useMutation<TData, TError, TVariables>(options)
