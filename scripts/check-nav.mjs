#!/usr/bin/env node
// Nav integrity check. Three pages were live as blank pages and two shipped
// with no frontmatter before this existed; a restructure moves every URL, so
// this has to run before one, not after.
import { readFileSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const docsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs')
const nav = JSON.parse(readFileSync(join(docsDir, 'docs.json'), 'utf8')).navigation

const pages = []
const walk = (n) => {
	if (Array.isArray(n)) return n.forEach(walk)
	if (!n || typeof n !== 'object') return
	for (const p of n.pages ?? []) (typeof p === 'string' ? pages.push(p) : walk(p))
	for (const k of ['tabs', 'groups', 'anchors']) (n[k] ?? []).forEach(walk)
}
walk(nav)

const problems = []
for (const p of pages) {
	const file = join(docsDir, p + '.mdx')
	if (!existsSync(file)) { problems.push(['missing', p]); continue }
	if (statSync(file).size === 0) { problems.push(['empty', p]); continue }
	if (!readFileSync(file, 'utf8').startsWith('---')) problems.push(['no-frontmatter', p])
}

const dupes = pages.filter((p, i) => pages.indexOf(p) !== i)
for (const d of new Set(dupes)) problems.push(['duplicate-nav-entry', d])

console.log(`${pages.length} pages in navigation`)
for (const [kind, p] of problems) console.error(`  ${kind.padEnd(18)} ${p}`)
if (problems.length) {
	console.error(`\n${problems.length} problem(s)`)
	process.exit(1)
}
console.log('nav ok')
