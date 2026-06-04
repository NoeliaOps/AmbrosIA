import { Font } from "@react-pdf/renderer"
import fs from "fs"
import path from "path"

// Fuentes empaquetadas localmente (assets/fonts/) para la generación de PDF.
// NO usar URLs remotas de Google Fonts: las rutas versionadas de gstatic
// rotan y devuelven 404, lo que rompía por completo el render de PDF.
const fontsDir = path.join(process.cwd(), "assets", "fonts")

let registered = false

export function registerPdfFonts() {
  if (registered) return
  registered = true

  Font.register({
    family: "Playfair",
    fonts: [
      { src: path.join(fontsDir, "PlayfairDisplay-Regular.ttf"), fontWeight: 400 },
      { src: path.join(fontsDir, "PlayfairDisplay-Bold.ttf"), fontWeight: 700 },
    ],
  })

  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(fontsDir, "Inter-Regular.ttf"), fontWeight: 400 },
      { src: path.join(fontsDir, "Inter-SemiBold.ttf"), fontWeight: 600 },
    ],
  })

  // Evita que react-pdf parta palabras con guiones automáticos.
  Font.registerHyphenationCallback((word) => [word])
}

// react-pdf NO lee imágenes desde una ruta de archivo: intenta hacer fetch
// del string como si fuera URL y falla en silencio (logo vacío). Hay que
// pasar un Buffer. Cacheamos el contenido del logo entre invocaciones.
let logoBuffer: Buffer | null | undefined
export function loadOrgLogo(): Buffer | undefined {
  if (logoBuffer !== undefined) return logoBuffer ?? undefined
  try {
    logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "brand", "logo-artesano-dark.jpg"))
  } catch {
    logoBuffer = null // no romper la generación del PDF si falta el logo
  }
  return logoBuffer ?? undefined
}
