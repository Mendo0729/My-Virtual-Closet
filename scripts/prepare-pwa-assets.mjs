import { access, copyFile, mkdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const sourceLogo = path.join(rootDir, 'src', 'assets', 'logo-my-virtual-closet.png')
const iconsDir = path.join(rootDir, 'public', 'icons')
const destinationLogo = path.join(iconsDir, 'logo-my-virtual-closet.png')

try {
  await access(sourceLogo, constants.R_OK)
  await mkdir(iconsDir, { recursive: true })
  await copyFile(sourceLogo, destinationLogo)
  console.log('[pwa] Logo copied to public/icons/logo-my-virtual-closet.png')
} catch (error) {
  if (error?.code === 'ENOENT') {
    console.warn('[pwa] src/assets/logo-my-virtual-closet.png is not committed yet; skipping icon copy.')
  } else {
    throw error
  }
}
