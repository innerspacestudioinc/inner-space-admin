import { useEffect, useState } from 'react'
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
  const [isUploading, setIsUploading] = useState(false)

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

  async function uploadFileAndSetUrl(file, bucketName, targetFieldName) {
    if (!file) {
      return
    }

    setIsUploading(true)
    setSubmitStatus('')

    const filePath = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file)

    if (uploadError) {
      setSubmitStatus(`Could not upload ${file.name}: ${uploadError.message}`)
      setIsUploading(false)
      return
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    setFormValues((current) => ({
      ...current,
      [targetFieldName]: data.publicUrl,
    }))

    setSubmitStatus(`${file.name} uploaded successfully ✅`)
    setIsUploading(false)
  }

  async function handleAudioFileChange(event) {
    const file = event.target.files?.[0]
    await uploadFileAndSetUrl(file, 'audio', 'audio_file_name')
  }

  async function handleThumbnailFileChange(event) {
    const file = event.target.files?.[0]
    await uploadFileAndSetUrl(file, 'thumbnails', 'thumbnail_file_name')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitStatus('')
    setIsSaving(true)

    const selectedCategory =
      formValues.category === 'Other' ? formValues.category_other.trim() : formValues.category.trim()

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
      audio_file_name: formValues.audio_file_name.trim() || null,
      thumbnail_file_name: formValues.thumbnail_file_name.trim() || null,
      featured: formValues.featured,
      published: formValues.published,
      recommended_next_id: formValues.recommended_next_id.trim() || null,
      content_type: formValues.content_type.trim() || null,
    }

    const { error } = await supabase.from('content').insert(payload)

    if (error) {
      setSubmitStatus(`Could not create content item: ${error.message}`)
      setIsSaving(false)
      return
    }

    setSubmitStatus('New content item created successfully ✅')
    setFormValues(initialFormValues)
    setIsSaving(false)
    loadContentRows()
  }

  return (
    <main className="page">
      <h1>Inner Space Admin Dashboard</h1>
      <p>This is your starter admin dashboard.</p>

      <section className="card">
        <h2>Create content item</h2>
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

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="featured"
              checked={formValues.featured}
              onChange={handleInputChange}
            />
            featured
          </label>

          <button className="full-width" type="submit" disabled={isSaving || isUploading}>
            {isSaving ? 'Saving…' : isUploading ? 'Uploading file…' : 'Create content item'}
          </button>
        </form>
        {submitStatus && <p className="hint">{submitStatus}</p>}
      </section>

      <section className="card">
        <h2>Supabase status</h2>
        <p>{status}</p>
        {contentRows.length > 0 ? (
          <table>
            <thead>
              <tr>
                {Object.keys(contentRows[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contentRows.map((row, index) => (
                <tr key={index}>
                  {Object.keys(contentRows[0]).map((key) => (
                    <td key={key}>{String(row[key] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="hint">No rows returned from the <code>content</code> table.</p>
        )}
      </section>
    </main>
  )
}

export default App
