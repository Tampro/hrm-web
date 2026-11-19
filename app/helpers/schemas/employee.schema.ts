import type { TFunction } from 'i18next'
import { z } from 'zod'

import { maxLength, required, requiredEmail, requiredText } from '~/helpers/schema.helper'
import { EEmployeeStatus, EEmploymentType, EGender } from '~/shared/enums/employee.enum'
import {
  EEmployeeFilterFormKey,
  EEmployeeFormKey,
  EEmployeePasswordFormKey,
  EEmployeeDocumentFormKey
} from '~/shared/enums/form.enum'

// Spec: employee-service EmployeeDtos (ProfileForm, BankingForm, EmployeeCreateForm, PasswordForm, DocumentForm).

const text = (max: number, t?: TFunction) => z.string().trim().max(max, maxLength(max, t))

const today = () => new Date().toISOString().slice(0, 10)

/** Optional decimal ≥ 0 typed as text (Spec: BankingForm.baseSalary @DecimalMin("0")) */
const optionalAmount = (t?: TFunction) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0), {
      message: t?.('validation.amount')
    })

// Spec: list filters (keyword matches full name, email, employee ID or code); ids of the org dropdowns
export const getEmployeeFilterSchema = (t?: TFunction) =>
  z.object({
    [EEmployeeFilterFormKey.Keyword]: text(255, t),
    [EEmployeeFilterFormKey.BranchId]: z.string(),
    [EEmployeeFilterFormKey.DepartmentId]: z.string(),
    [EEmployeeFilterFormKey.DesignationId]: z.string()
  })

export type TEmployeeFilterSchema = z.infer<ReturnType<typeof getEmployeeFilterSchema>>

const documentRow = (t?: TFunction) =>
  z.object({
    [EEmployeeDocumentFormKey.DocumentTypeId]: z.string().min(1, required(t)),
    [EEmployeeDocumentFormKey.File]: z.custom<File | null>().refine((f): boolean => !!f, {
      message: t?.('employee.validation.file_required')
    }),
    [EEmployeeDocumentFormKey.ExpiryDate]: z.string()
  })

export const getEmployeeDocumentSchema = (t?: TFunction) => documentRow(t)

export type TEmployeeDocumentSchema = z.infer<ReturnType<typeof getEmployeeDocumentSchema>>

/**
 * Add / Edit wizard, one form for every step. isCreate adds the account step (email + optional first password +
 * documents); on edit those fields are not validated (the login is managed from the detail page).
 */
export const getEmployeeSchema = (t?: TFunction, isCreate = true) =>
  z
    .object({
      // Step 1 — personal
      [EEmployeeFormKey.FullName]: requiredText(255, t),
      [EEmployeeFormKey.DateOfBirth]: z
        .string()
        .refine((v) => v === '' || v < today(), { message: t?.('employee.validation.past_date') }),
      [EEmployeeFormKey.Gender]: z.union([z.enum(EGender), z.literal('')]),
      [EEmployeeFormKey.Phone]: text(30, t).regex(/^[0-9+\-\s().]*$/, t?.('validation.phone')),
      [EEmployeeFormKey.ProfileImage]: z.custom<File | null>(),
      [EEmployeeFormKey.AddressLine1]: text(255, t),
      [EEmployeeFormKey.AddressLine2]: text(255, t),
      [EEmployeeFormKey.City]: text(100, t),
      [EEmployeeFormKey.State]: text(100, t),
      [EEmployeeFormKey.Country]: text(100, t),
      [EEmployeeFormKey.PostalCode]: text(20, t),
      [EEmployeeFormKey.EmergencyName]: text(255, t),
      [EEmployeeFormKey.EmergencyRelationship]: text(50, t),
      [EEmployeeFormKey.EmergencyPhone]: text(30, t).regex(/^[0-9+\-\s().]*$/, t?.('validation.phone')),
      // Step 2 — work
      [EEmployeeFormKey.EmployeeCode]: text(50, t).regex(/^[A-Za-z0-9._-]*$/, t?.('employee.validation.code')),
      [EEmployeeFormKey.BranchId]: z.string(),
      [EEmployeeFormKey.DepartmentId]: z.string(),
      [EEmployeeFormKey.DesignationId]: z.string(),
      [EEmployeeFormKey.DateOfJoining]: z.string().min(1, required(t)),
      [EEmployeeFormKey.EmploymentType]: z.enum(EEmploymentType),
      [EEmployeeFormKey.Status]: z.enum([
        EEmployeeStatus.Active,
        EEmployeeStatus.Inactive,
        EEmployeeStatus.Probation,
        EEmployeeStatus.Terminated
      ]),
      [EEmployeeFormKey.ReportsToId]: z.string(),
      // Step 3 — banking (ignored by the backend without EMPLOYEE_BANKING_VIEW)
      [EEmployeeFormKey.BankName]: text(150, t),
      [EEmployeeFormKey.AccountHolderName]: text(255, t),
      [EEmployeeFormKey.AccountNumber]: text(50, t),
      [EEmployeeFormKey.BankIdentifierCode]: text(20, t),
      [EEmployeeFormKey.BankBranch]: text(150, t),
      [EEmployeeFormKey.TaxPayerId]: text(50, t),
      [EEmployeeFormKey.BaseSalary]: optionalAmount(t),
      // Step 4 — account (create only)
      [EEmployeeFormKey.Email]: isCreate ? requiredEmail(100, t) : z.string(),
      [EEmployeeFormKey.Password]: isCreate
        ? z.string().refine((v) => v === '' || (v.length >= 8 && v.length <= 128), {
            message: t?.('employee.validation.password_length')
          })
        : z.string(),
      [EEmployeeFormKey.Documents]: isCreate ? z.array(documentRow(t)) : z.array(z.any())
    })
    // Spec: EMP_023 — a department needs a branch, a designation needs a department
    .refine((v) => !v.departmentId || !!v.branchId, {
      path: [EEmployeeFormKey.BranchId],
      message: t?.('employee.validation.branch_first')
    })
    .refine((v) => !v.designationId || !!v.departmentId, {
      path: [EEmployeeFormKey.DepartmentId],
      message: t?.('employee.validation.department_first')
    })

export type TEmployeeSchema = z.infer<ReturnType<typeof getEmployeeSchema>>

// Spec: PasswordForm — 8–128, confirmation must match (EMP_020)
export const getEmployeePasswordSchema = (t?: TFunction) =>
  z
    .object({
      [EEmployeePasswordFormKey.NewPassword]: z
        .string()
        .min(8, t?.('employee.validation.password_length'))
        .max(128, t?.('employee.validation.password_length')),
      [EEmployeePasswordFormKey.ConfirmPassword]: z.string().min(1, required(t))
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      path: [EEmployeePasswordFormKey.ConfirmPassword],
      message: t?.('employee.validation.password_mismatch')
    })

export type TEmployeePasswordSchema = z.infer<ReturnType<typeof getEmployeePasswordSchema>>
