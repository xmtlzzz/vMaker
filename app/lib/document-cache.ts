import type { Project, ProjectPayload } from '~/lib/github/projects'
import { weakEtag } from '~/lib/http-cache'

// Validators for server-rendered HTML.
//
// The body is not available before rendering, so the tag is derived from the data
// that decides the body instead of from the markup: whenever a project is added,
// removed, or moves its timestamps, the signature changes and the tag changes with
// it. Two renders of identical data always produce the identical tag, which is what
// lets a conditional request answer 304 without rendering at all.
export function documentEtag(signature: string): string {
  return weakEtag(signature)
}

function projectPart(project: Project) {
  return [
    project.name,
    project.pushedAt ?? '',
    project.updatedAt,
    project.stars,
    project.featured ? '1' : '0',
  ].join(':')
}

export function indexSignature(payload: ProjectPayload) {
  return [
    'index',
    // The owner is rendered in the header and hero copy, so a changed account must
    // invalidate the document even when the project list itself looks unchanged.
    payload.owner.login,
    payload.summary.totalProjects,
    payload.summary.latestActivity ?? '',
    payload.error ?? '',
    ...payload.projects.map(projectPart),
  ].join('|')
}

export function projectSignature(project: Project) {
  return ['project', projectPart(project), project.description].join('|')
}

// A route that throws a Response (a 304) never runs its own headers(): react-router
// cuts the matched routes back to the boundary that handles the error, so the
// boundary is the one whose headers() reaches the document response. Forward the
// thrown response's validators there, or the 304 goes out without the ETag that
// RFC 9110 requires it to carry.
export function forwardDocumentHeaders({
  errorHeaders,
  loaderHeaders,
}: {
  errorHeaders?: Headers
  loaderHeaders: Headers
}) {
  return new Headers(errorHeaders ?? loaderHeaders)
}

// HTML must be revalidated on every request: the ETag makes that cheap, and a
// stale CDN copy is worse than a 304 round trip.
export const DOCUMENT_CACHE_CONTROL = 'public, max-age=0, must-revalidate'

export function documentHeaders(etag: string): Record<string, string> {
  return { 'Cache-Control': DOCUMENT_CACHE_CONTROL, ETag: etag }
}

export function notModifiedResponse(etag: string) {
  return new Response(null, { headers: documentHeaders(etag), status: 304 })
}
