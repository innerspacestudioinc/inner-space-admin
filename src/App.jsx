import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabaseClient'

const CATEGORY_OPTIONS = ['Sleep', 'Pain', 'Hormones', 'Racing Thoughts', 'Stress', 'Learn', 'Breathwork', 'Other']
const VARIANT_OPTIONS = ['Voice Only', 'Ambience', 'Brown Noise', 'Mix']

const initialFormValues = {
  content_id: '',
  title: '',
  series: '',
  category: '',
  category_other: '',
  tags: '',
  variant: '',
  duration: '',
  description: '',
  source_file_name: '',
  audio_file_name: '',
  thumbnail_file_name: '',
  featured: false,
  published: true,
  recommended_next_id: '',
  content_type: 'guided_session',
}

function App() {
  const [status, setStatus] = useState('Checking connection...')
  const [contentRows, setContentRows] = useState([])
  const [formValues, setFormValues] = useState(initialFormValues)
  const [submitStatus, setSubmitStatus] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedAudioFile, setSelectedAudioFile] = useState(null)
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null)
  const [editingContentId, setEditingContentId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [variantFilter, setVariantFilter] = useState('')
  const [publishedFilter, setPublishedFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'content_id', direction: 'asc' })
  const [isFormHighlighted, setIsFormHighlighted] = useState(false)
  const formCardRef = useRef(null)
  const sortableColumns = useMemo(
    () => new Set(['content_id', 'title', 'category', 'variant', 'duration', 'published']),
    [],
  )

  async function loadContentRows() {
    const { data, error } = await supabase.from('content').select('*').limit(5)

    if (error) {
      setStatus(`Connected, but table check failed: ${error.message}`)
      return
    }

    setStatus('Connected to Supabase ✅')
    setContentRows(data ?? [])
  }

  useEffect(() => {
    loadContentRows()
  }, [])

  const categoryFilterOptions = useMemo(() => {
    return Array.from(new Set(contentRows.map((row) => row.category).filter(Boolean))).sort()
  }, [contentRows])

  const variantFilterOptions = useMemo(() => {
    return Array.from(new Set(contentRows.map((row) => row.variant).filter(Boolean))).sort()
  }, [contentRows])

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return contentRows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        String(row.title ?? '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.content_id ?? '')
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesCategory = !categoryFilter || String(row.category ?? '') === categoryFilter
      const matchesVariant = !variantFilter || String(row.variant ?? '') === variantFilter
      const matchesPublished =
        !publishedFilter ||
        String(Boolean(row.published)) === publishedFilter

      return matchesSearch && matchesCategory && matchesVariant && matchesPublished
    })
  }, [contentRows, searchQuery, categoryFilter, variantFilter, publishedFilter])

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows]
    const { key, direction } = sortConfig

    rows.sort((a, b) => {
      const aValue = a?.[key]
      const bValue = b?.[key]

      if (key === 'published') {
        const aBool = Number(Boolean(aValue))
        const bBool = Number(Boolean(bValue))
        return direction === 'asc' ? aBool - bBool : bBool - aBool
      }

      const aText = String(aValue ?? '').toLowerCase()
      const bText = String(bValue ?? '').toLowerCase()
      const comparison = aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' })

      return direction === 'asc' ? comparison : -comparison
    })

    return rows
  }, [filteredRows, sortConfig])

  function handleSort(column) {
    if (!sortableColumns.has(column)) {
      return
    }

    setSortConfig((current) => ({
      key: column,
      direction: current.key === column && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  function clearFilters() {
    setSearchQuery('')
    setCategoryFilter('')
    setVariantFilter('')
    setPublishedFilter('')
  }

  function clearForm() {
    setFormValues(initialFormValues)
    setSelectedAudioFile(null)
    setSelectedThumbnailFile(null)
    setEditingContentId(null)
  }

  function getFormValuesFromRow(row) {
    const rowCategory = row.category ?? ''
    const matchesCategoryOption = CATEGORY_OPTIONS.includes(rowCategory)

    return {
      content_id: row.content_id ?? '',
      title: row.title ?? '',
      series: row.series ?? '',
      category: rowCategory ? (matchesCategoryOption ? rowCategory : 'Other') : '',
      category_other: rowCategory && !matchesCategoryOption ? rowCategory : '',
      tags: Array.isArray(row.tags) ? row.tags.join(', ') : row.tags ?? '',
      variant: row.variant ?? '',
      duration: row.duration ?? '',
      description: row.description ?? '',
      source_file_name: row.source_file_name ?? '',
      audio_file_name: row.audio_file_name ?? '',
      thumbnail_file_name: row.thumbnail_file_name ?? '',
      featured: Boolean(row.featured),
      published: Boolean(row.published),
      recommended_next_id: row.recommended_next_id ?? '',
      content_type: row.content_type ?? 'guided_session',
    }
  }

  function handleRowClick(row) {
    setFormValues(getFormValuesFromRow(row))

    setSelectedAudioFile(null)
    setSelectedThumbnailFile(null)
    setEditingContentId(row.content_id)
    setSubmitStatus('Editing existing content item.')

    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setIsFormHighlighted(true)
  }

  function handleDuplicateClick(row) {
    const duplicatedValues = getFormValuesFromRow(row)

    setFormValues({
      ...duplicatedValues,
      content_id: `${row.content_id ?? ''}_copy`,
    })
    setSelectedAudioFile(null)
    setSelectedThumbnailFile(null)
    setEditingContentId(null)
    setSubmitStatus(`Duplicating ${row.content_id}. Update any fields and click "Create content item".`)

    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setIsFormHighlighted(true)
  }

  useEffect(() => {
    if (!isFormHighlighted) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsFormHighlighted(false)
    }, 1200)

    return () => window.clearTimeout(timeoutId)
  }, [isFormHighlighted])

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target

    if (name === 'category') {
      setFormValues((current) => ({
        ...current,
        category: value,
        category_other: value === 'Other' ? current.category_other : '',
      }))
      return
    }

    setFormValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function uploadFile(file, bucketName) {
    const sanitizedFileName = file.name.replace(/\s+/g, '-')
    const filePath = `${Date.now()}-${sanitizedFileName}`

    const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file)

    if (uploadError) {
      console.error(`Upload failed for ${file.name} in bucket "${bucketName}"`, uploadError)
      throw new Error(`Could not upload ${file.name}: ${uploadError.message}`)
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    if (!data?.publicUrl) {
      const publicUrlError = new Error(`Could not generate public URL for ${file.name}`)
      console.error(`Public URL generation failed for ${file.name} in bucket "${bucketName}"`, publicUrlError)
      throw publicUrlError
    }

    return data.publicUrl
  }

  function handleAudioFileChange(event) {
    const file = event.target.files?.[0]
    setSelectedAudioFile(file ?? null)
  }

  function handleThumbnailFileChange(event) {
    const file = event.target.files?.[0]
    setSelectedThumbnailFile(file ?? null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitStatus('')
    setIsSaving(true)

    const selectedCategory =
      formValues.category === 'Other' ? formValues.category_other.trim() : formValues.category.trim()

    let uploadedAudioUrl = formValues.audio_file_name.trim() || null
    let uploadedThumbnailUrl = formValues.thumbnail_file_name.trim() || null

    try {
      if (selectedAudioFile || selectedThumbnailFile) {
        setIsUploading(true)
      }

      if (selectedAudioFile) {
        uploadedAudioUrl = await uploadFile(selectedAudioFile, 'audio')
      }

      if (selectedThumbnailFile) {
        uploadedThumbnailUrl = await uploadFile(selectedThumbnailFile, 'thumbnails')
      }
    } catch (uploadError) {
      setSubmitStatus(uploadError.message)
      setIsSaving(false)
      setIsUploading(false)
      return
    }

    setIsUploading(false)

    const payload = {
      content_id: formValues.content_id.trim(),
      title: formValues.title.trim(),
      series: formValues.series.trim() || null,
      category: selectedCategory || null,
      tags: formValues.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      variant: formValues.variant.trim() || null,
      duration: formValues.duration.trim() || null,
      description: formValues.description.trim() || null,
      source_file_name: formValues.source_file_name.trim() || null,
      audio_file_name: uploadedAudioUrl,
      thumbnail_file_name: uploadedThumbnailUrl,
      featured: formValues.featured,
      published: formValues.published,
      recommended_next_id: formValues.recommended_next_id.trim() || null,
      content_type: formValues.content_type.trim() || null,
    }

    const query = editingContentId
      ? supabase.from('content').update(payload).eq('content_id', editingContentId)
      : supabase.from('content').insert(payload)

    const { error } = await query

    if (error) {
      setSubmitStatus(`Could not ${editingContentId ? 'update' : 'create'} content item: ${error.message}`)
      setIsSaving(false)
      setIsUploading(false)
      return
    }

    setSubmitStatus(editingContentId ? 'Content item updated successfully ✅' : 'New content item created successfully ✅')
    clearForm()
    setIsSaving(false)
    setIsUploading(false)
    loadContentRows()
  }

  async function handleDelete(contentId) {
    const confirmed = window.confirm('Are you sure you want to delete this content item?')

    if (!confirmed) {
      return
    }

    setSubmitStatus('')
    setIsDeleting(true)

    const { error } = await supabase.from('content').delete().eq('content_id', contentId)

    if (error) {
      setSubmitStatus(`Could not delete content item: ${error.message}`)
      setIsDeleting(false)
      return
    }

    if (editingContentId === contentId) {
      clearForm()
    }

    setSubmitStatus('Content item deleted successfully ✅')
    setIsDeleting(false)
    loadContentRows()
  }

  return (
    <main className="page">
      <h1>Inner Space Admin Dashboard</h1>
      <p>This is your starter admin dashboard.</p>

      <section ref={formCardRef} className={`card ${isFormHighlighted ? 'card-highlight' : ''}`}>
        <h2>{editingContentId ? 'Edit content item' : 'Create content item'}</h2>
        <p className="hint">Mode: {editingContentId ? `Editing ${editingContentId}` : 'Creating new content item'}</p>
        <form className="simple-form" onSubmit={handleSubmit}>
          <label>
            content_id
            <input name="content_id" value={formValues.content_id} onChange={handleInputChange} required />
          </label>

          <label>
            title
            <input name="title" value={formValues.title} onChange={handleInputChange} required />
          </label>

          <label>
            series
            <input name="series" value={formValues.series} onChange={handleInputChange} />
          </label>

          <label>
            category
            <select name="category" value={formValues.category} onChange={handleInputChange} required>
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {formValues.category === 'Other' && (
            <label>
              new category
              <input
                name="category_other"
                value={formValues.category_other}
                onChange={handleInputChange}
                required
              />
            </label>
          )}

          <label>
            tags (comma separated)
            <input name="tags" value={formValues.tags} onChange={handleInputChange} placeholder="space, meditation" />
          </label>

          <label>
            variant
            <select name="variant" value={formValues.variant} onChange={handleInputChange} required>
              <option value="">Select variant</option>
              {VARIANT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            duration
            <input
              name="duration"
              type="text"
              placeholder="mm:ss or hh:mm:ss"
              value={formValues.duration}
              onChange={handleInputChange}
              required
            />
          </label>

          <label className="full-width">
            description
            <textarea name="description" value={formValues.description} onChange={handleInputChange} rows={4} />
          </label>

          <label>
            source_file_name
            <input name="source_file_name" value={formValues.source_file_name} onChange={handleInputChange} />
          </label>

          <label>
            audio_file_name
            <input name="audio_file_name" value={formValues.audio_file_name} onChange={handleInputChange} />
          </label>

          <label>
            thumbnail_file_name
            <input name="thumbnail_file_name" value={formValues.thumbnail_file_name} onChange={handleInputChange} />
          </label>

          <label>
            upload audio file
            <input type="file" accept="audio/*" onChange={handleAudioFileChange} />
          </label>

          <label>
            upload thumbnail image
            <input type="file" accept="image/*" onChange={handleThumbnailFileChange} />
          </label>

          <label>
            recommended_next_id
            <input
              name="recommended_next_id"
              value={formValues.recommended_next_id}
              onChange={handleInputChange}
            />
          </label>

          <label>
            content_type
            <input name="content_type" value={formValues.content_type} onChange={handleInputChange} />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="featured"
              checked={formValues.featured}
              onChange={handleInputChange}
            />
            featured
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="published"
              checked={formValues.published}
              onChange={handleInputChange}
            />
            published
          </label>

          <button className="full-width" type="submit" disabled={isSaving || isUploading}>
            {isSaving ? 'Saving…' : isUploading ? 'Uploading file…' : editingContentId ? 'Update content item' : 'Create content item'}
          </button>

          {editingContentId && (
            <button className="full-width secondary-button" type="button" onClick={clearForm}>
              Cancel edit
            </button>
          )}
        </form>
        {submitStatus && <p className="hint">{submitStatus}</p>}
      </section>

      <section className="card">
        <h2>Supabase status</h2>
        <p>{status}</p>
        <div className="table-controls">
          <label>
            Search
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title or content_id"
            />
          </label>

          <label>
            Category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">All categories</option>
              {categoryFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Variant
            <select value={variantFilter} onChange={(event) => setVariantFilter(event.target.value)}>
              <option value="">All variants</option>
              {variantFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Published
            <select value={publishedFilter} onChange={(event) => setPublishedFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
          </label>

          <button type="button" className="secondary-button filter-clear-button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
        {contentRows.length > 0 ? (
          <div className="table-wrapper">
            <table className="content-table">
            <thead>
              <tr>
                {Object.keys(contentRows[0]).map((key) => {
                  const isSortable = sortableColumns.has(key)
                  const isActive = sortConfig.key === key
                  const indicator = isActive ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''

                  return (
                    <th key={key}>
                      {isSortable ? (
                        <button type="button" className="sort-button" onClick={() => handleSort(key)}>
                          {key} {indicator}
                        </button>
                      ) : (
                        key
                      )}
                    </th>
                  )
                })}
                <th className="actions-column">actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, index) => (
                <tr key={index} className="table-row" onClick={() => handleRowClick(row)}>
                  {Object.keys(contentRows[0]).map((key) => {
                    const cellValue = String(row[key] ?? '')
                    const shouldTruncate = key === 'audio_file_name' || key === 'thumbnail_file_name'

                    return (
                      <td key={key} title={shouldTruncate ? cellValue : undefined}>
                        {shouldTruncate ? <span className="truncate-cell">{cellValue}</span> : cellValue}
                      </td>
                    )
                  })}
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleRowClick(row)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDuplicateClick(row)
                      }}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={isDeleting}
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDelete(row.content_id)
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        ) : (
          <p className="hint">No rows returned from the <code>content</code> table.</p>
        )}
        {contentRows.length > 0 && sortedRows.length === 0 && (
          <p className="hint">No content rows match the current filters.</p>
        )}
      </section>
    </main>
  )
}

export default App
