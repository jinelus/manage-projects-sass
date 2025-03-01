export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/gi, '') // remove symbols and accents
    .replace(/\s+/g, '-') // replace spaces with dashes
    .replace(/-+/g, '-') // replace multiple dashes with a single dash
}
