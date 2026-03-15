import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// SVG crescent moon + "N" icon for Nuuru
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#16a34a"/>
  <!-- Crescent moon -->
  <circle cx="256" cy="200" r="130" fill="#ffffff"/>
  <circle cx="310" cy="170" r="105" fill="#16a34a"/>
  <!-- Arabic letter style dot/star decoration -->
  <circle cx="370" cy="310" r="18" fill="#ffffff"/>
  <circle cx="320" cy="340" r="12" fill="#ffffff"/>
  <circle cx="370" cy="350" r="8" fill="#ffffff"/>
  <!-- Bottom text: ن (Noon) -->
  <text x="256" y="440" font-family="serif" font-size="120" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">ن</text>
</svg>
`

async function generateIcons() {
  const svgBuffer = Buffer.from(svgIcon)

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192.png'))
  console.log('✓ icon-192.png generated')

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512.png'))
  console.log('✓ icon-512.png generated')
}

generateIcons().catch(console.error)
