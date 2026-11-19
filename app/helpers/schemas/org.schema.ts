import type { TFunction } from 'i18next'
import { z } from 'zod'

import { maxLength, required, requiredText } from '~/helpers/schema.helper'
import {
  EBranchFormKey,
  EDepartmentFilterFormKey,
  EDepartmentFormKey,
  EDesignationFilterFormKey,
  EDesignationFormKey
} from '~/shared/enums/form.enum'

const text = (max: number, t?: TFunction) => z.string().trim().max(max, maxLength(max, t))

// Spec: employee-service BranchForm — name required ≤ 150 (unique in the company, EMP_011), optional email @Email
export const getBranchSchema = (t?: TFunction) =>
  z.object({
    [EBranchFormKey.Name]: requiredText(150, t),
    [EBranchFormKey.Address]: text(255, t),
    [EBranchFormKey.City]: text(100, t),
    [EBranchFormKey.State]: text(100, t),
    [EBranchFormKey.Country]: text(100, t),
    [EBranchFormKey.PostalCode]: text(20, t),
    [EBranchFormKey.Phone]: text(30, t).regex(/^[0-9+\-\s().]*$/, t?.('validation.phone')),
    [EBranchFormKey.Email]: text(255, t).refine((v) => v === '' || z.email().safeParse(v).success, {
      message: t?.('validation.email')
    }),
    [EBranchFormKey.Active]: z.boolean()
  })

export type TBranchSchema = z.infer<ReturnType<typeof getBranchSchema>>

// Spec: DepartmentForm — name required ≤ 150 (unique in the branch, EMP_011), branch required, description ≤ 500
export const getDepartmentSchema = (t?: TFunction) =>
  z.object({
    [EDepartmentFormKey.Name]: requiredText(150, t),
    [EDepartmentFormKey.BranchId]: z.string().min(1, required(t)),
    [EDepartmentFormKey.Description]: text(500, t),
    [EDepartmentFormKey.Active]: z.boolean()
  })

export type TDepartmentSchema = z.infer<ReturnType<typeof getDepartmentSchema>>

// Spec: department list filters — keyword matches name or description; branchId
export const getDepartmentFilterSchema = (t?: TFunction) =>
  z.object({
    [EDepartmentFilterFormKey.Keyword]: text(255, t),
    [EDepartmentFilterFormKey.BranchId]: z.string()
  })

export type TDepartmentFilterSchema = z.infer<ReturnType<typeof getDepartmentFilterSchema>>

// Spec: DesignationForm — name required ≤ 150 (unique in the department, EMP_011), department required, description ≤ 500
export const getDesignationSchema = (t?: TFunction) =>
  z.object({
    [EDesignationFormKey.Name]: requiredText(150, t),
    [EDesignationFormKey.DepartmentId]: z.string().min(1, required(t)),
    [EDesignationFormKey.Description]: text(500, t),
    [EDesignationFormKey.Active]: z.boolean()
  })

export type TDesignationSchema = z.infer<ReturnType<typeof getDesignationSchema>>

// Spec: designation list filters — keyword matches name or description; departmentId
export const getDesignationFilterSchema = (t?: TFunction) =>
  z.object({
    [EDesignationFilterFormKey.Keyword]: text(255, t),
    [EDesignationFilterFormKey.DepartmentId]: z.string()
  })

export type TDesignationFilterSchema = z.infer<ReturnType<typeof getDesignationFilterSchema>>
