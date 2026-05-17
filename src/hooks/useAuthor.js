import { useState, useEffect } from 'react'

export function useAuthor(authorName) {
  const [author, setAuthor] = useState(null)

  useEffect(() => {
    if (!authorName) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(
          `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(authorName)}&limit=1`
        )
        const data = await res.json()
        const first = data.docs?.[0]
        if (!first || cancelled) return

        const photoUrl = first.key
          ? `https://covers.openlibrary.org/a/olid/${first.key.replace('/authors/', '')}-M.jpg`
          : null

        // Fetch bio
        let bio = first.top_subjects?.slice(0, 3).join(', ') || ''
        try {
          const detailRes = await fetch(`https://openlibrary.org${first.key}.json`)
          const detail = await detailRes.json()
          if (!cancelled) {
            bio = typeof detail.bio === 'string'
              ? detail.bio
              : detail.bio?.value || bio
          }
        } catch {}

        if (!cancelled) {
          setAuthor({
            name: first.name,
            photoUrl,
            bio,
            birthDate: first.birth_date || null,
            workCount: first.work_count || 0,
          })
        }
      } catch {}
    }

    load()
    return () => { cancelled = true }
  }, [authorName])

  return author
}
