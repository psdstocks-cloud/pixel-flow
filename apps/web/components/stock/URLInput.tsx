'use client'

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'

type URLInputProps = {
  value?: string
  maxUrls?: number
  placeholder?: string
  disabled?: boolean
  onChange?: (value: string) => void
  onValidUrlsChange?: (urls: string[]) => void
}

type ParsedUrl = {
  raw: string
  isValid: boolean
  hostname: string | null
}

const DEFAULT_PLACEHOLDER = ['https://stock.adobe.com/image/123456', 'https://www.shutterstock.com/image/789012', 'https://elements.envato.com/asset'].join('\n')

export function URLInput({
  value,
  maxUrls = 5,
  placeholder = DEFAULT_PLACEHOLDER,
  disabled = false,
  onChange,
  onValidUrlsChange,
}: URLInputProps) {
  const [inputValue, setInputValue] = useState(value ?? '')

  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value)
    }
  }, [value, inputValue])

  const parsedUrls = useMemo<ParsedUrl[]>(() => {
    return inputValue
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, maxUrls)
      .map((raw) => {
        try {
          const url = new URL(raw)
          return { raw, isValid: true, hostname: url.hostname.replace(/^www\./, '') }
        } catch {
          return { raw, isValid: false, hostname: null }
        }
      })
  }, [inputValue, maxUrls])

  useEffect(() => {
    if (onValidUrlsChange) {
      onValidUrlsChange(parsedUrls.filter((item) => item.isValid).map((item) => item.raw))
    }
  }, [parsedUrls, onValidUrlsChange])

  const handleChange = (next: string) => {
    setInputValue(next)
    onChange?.(next)
  }

  return (
    <div className="order-url-input">
      <div className="order-url-input__header">
        <label className="order-url-input__label">Paste stock URLs</label>
        <span
          className={clsx('order-url-input__count', {
            'order-url-input__count--limit': parsedUrls.length >= maxUrls,
          })}
        >
          {parsedUrls.length} / {maxUrls}
        </span>
      </div>

      <textarea
        value={inputValue}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="order-url-input__textarea"
        aria-describedby="order-url-input-helper"
      />

      <div id="order-url-input-helper" className="order-url-input__helper">
        Separate links with line breaks. We support https URLs only.
      </div>

      {parsedUrls.length > 0 ? (
        <div className="order-url-input__chips" role="list" aria-label="URL validation results">
          {parsedUrls.map((item, index) => (
            <div
              key={`${item.raw}-${index}`}
              role="listitem"
              className={clsx('order-url-input__chip', {
                'order-url-input__chip--valid': item.isValid,
                'order-url-input__chip--invalid': !item.isValid,
              })}
            >
              <span aria-hidden="true">{item.isValid ? '✓' : '✕'}</span>
              <span className="order-url-input__chip-text">
                {item.hostname ?? 'Invalid URL'}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="order-url-input__actions">
        <button
          type="button"
          onClick={() => {
            handleChange('')
          }}
          className="order-url-input__action"
          disabled={disabled || inputValue.length === 0}
        >
          Clear all
        </button>
        <button type="button" className="order-url-input__action" disabled>
          + Add examples
        </button>
      </div>
    </div>
  )
}
