import { FileUp, X } from 'lucide-react'
import { useId, useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { commonHelper } from '~/helpers/common.helper'
import { cn } from '~/lib/utils'

interface IProps {
  value: File[]
  onChange: (files: File[]) => void
  isMultiple?: boolean
  /** input accept, e.g. '.xlsx' or 'image/png,image/jpeg' */
  accept?: string
  maxFileSizeBytes?: number
  /** message shown when a picked file is larger than maxFileSizeBytes (the file is not added) */
  maxFileSizeExceeded?: string
  isInValid?: boolean
  title?: string
  description?: string
  disabled?: boolean
  /** accessible name of the drop zone button */
  ariaLabel?: string
}

/** Click-or-drop file picker for one or many files of any type (same props as the team component) */
export function UploadFile({
  value,
  onChange,
  isMultiple,
  accept,
  maxFileSizeBytes,
  maxFileSizeExceeded,
  isInValid,
  title,
  description,
  disabled,
  ariaLabel
}: IProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | undefined>()
  const [isDragging, setIsDragging] = useState(false)

  const addFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    const tooLarge = maxFileSizeBytes ? picked.filter((f) => f.size > maxFileSizeBytes) : []
    setError(tooLarge.length ? maxFileSizeExceeded : undefined)
    const accepted = picked.filter((f) => !tooLarge.includes(f))
    if (accepted.length) onChange(isMultiple ? [...value, ...accepted] : accepted.slice(0, 1))
    // same file can be picked again after removing it
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled) addFiles(e.dataTransfer.files)
  }

  return (
    <div className='flex min-w-0 flex-col gap-2'>
      <button
        type='button'
        aria-label={ariaLabel ?? title ?? t('upload.choose')}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'border-input text-muted-foreground hover:bg-muted/50 flex flex-col items-center gap-1 rounded-lg border border-dashed p-4 text-center text-sm transition-colors disabled:opacity-50',
          isDragging && 'border-primary bg-primary/5',
          (isInValid || error) && 'border-destructive'
        )}
      >
        <FileUp className='text-primary size-5' />
        <span className='text-foreground font-medium'>{title ?? t('upload.choose')}</span>
        {description && <span className='text-xs'>{description}</span>}
      </button>
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        className='hidden'
        accept={accept}
        multiple={isMultiple}
        onChange={(e) => addFiles(e.target.files)}
      />
      {error && <p className='text-destructive text-sm'>{error}</p>}
      {value.length > 0 && (
        <ul className='flex flex-col gap-1'>
          {value.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className='bg-muted/50 flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm'
            >
              <span className='min-w-0 truncate'>
                {file.name} <span className='text-muted-foreground'>({commonHelper.formatFileSize(file.size)})</span>
              </span>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label={t('upload.remove', { name: file.name })}
                disabled={disabled}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
