#!/usr/bin/env node
// Dependency-free build.
//
// The host half is plain ESM importing only node: builtins and its own sibling
// modules, so copying src/ into lib/ is a complete build. The client half is
// CommonJS loaded through window.__ModuleLoader__ with a harness-provided
// require(), so its single relative require (the stylesheet) is inlined here.

import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { wrapClient } from './wrap-client.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'lib')
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })

await copyFile(join(root, 'src', 'host.js'), join(out, 'index.js'))
for (const file of ['gate.js', 'transport.js']) {
  await copyFile(join(root, 'src', file), join(out, file))
}

const cssModule = await import(pathToFileURL(join(root, 'src', 'client-css.cjs')).href)
const css = cssModule.default
if (typeof css !== 'string' || css.length === 0) {
  throw new Error('src/client-css.cjs did not export a non-empty CSS string')
}

const clientSource = await readFile(join(root, 'src', 'client.cjs'), 'utf8')
const CSS_REQUIRE = /require\((['"])\.\/client-css\.cjs\1\)/
if (!CSS_REQUIRE.test(clientSource)) {
  throw new Error('src/client.cjs no longer requires ./client-css.cjs - update scripts/build.mjs')
}

const bundle = wrapClient(clientSource.replace(CSS_REQUIRE, JSON.stringify(css)), pkg.name)
await writeFile(join(out, 'client.js'), bundle)

new Function(bundle)
const host = await import(pathToFileURL(join(out, 'index.js')).href)
if (host.name !== pkg.name || typeof host.apply !== 'function') {
  throw new Error('invalid host plugin export: expected name "' + pkg.name + '" and an apply() function')
}

console.log('Built ' + pkg.name + ' ' + pkg.version + ': lib/index.js and lib/client.js')
