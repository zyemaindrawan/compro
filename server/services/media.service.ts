import sharp, { type Sharp } from 'sharp'
import { encode } from 'blurhash'
import { fileTypeFromBuffer } from 'file-type'
import type { MediaPurpose } from '#shared/schemas/media.schema'
import {
  MEDIA_ACCEPTED_TYPES,
  MEDIA_MAX_BYTES,
  MEDIA_MAX_DIMENSION,
  MEDIA_VARIANT_WIDTHS,
} from '#shared/constants'

export interface ProcessedFile {
  body: Buffer
  contentType: string
  extension: string
  width: number | null
  height: number | null
}

export interface ProcessedImage {
  main: ProcessedFile
  variants: { width: number, body: Buffer }[]
  blurhash: string | null
}

const WEBP_QUALITY = 80
const FAVICON_SIZE = 512
const UNSAFE_SVG = /<script|<foreignObject|\son[a-z]+\s*=|javascript:|<iframe|<embed|<object|xlink:href\s*=\s*["'](?!#)|href\s*=\s*["'](?!#)/i

type AcceptedType = (typeof MEDIA_ACCEPTED_TYPES)[number]

function isAccepted(mime: string): mime is AcceptedType {
  return (MEDIA_ACCEPTED_TYPES as readonly string[]).includes(mime)
}

async function detectType(body: Buffer) {
  const detected = await fileTypeFromBuffer(body)
  if (detected) return detected.mime

  const head = body.subarray(0, 1024).toString('utf8').trimStart()
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return 'image/svg+xml'
  return null
}

function processSvg(body: Buffer): ProcessedImage {
  const markup = body.toString('utf8')
  if (UNSAFE_SVG.test(markup)) {
    throw createError({ statusCode: 422, message: 'This SVG contains scripts or external links and was rejected.' })
  }
  const viewBox = markup.match(/viewBox\s*=\s*["'][\d.\s-]+\s([\d.]+)\s([\d.]+)["']/i)
  return {
    main: {
      body,
      contentType: 'image/svg+xml',
      extension: 'svg',
      width: viewBox ? Math.round(Number(viewBox[1])) : null,
      height: viewBox ? Math.round(Number(viewBox[2])) : null,
    },
    variants: [],
    blurhash: null,
  }
}

async function computeBlurhash(image: Sharp) {
  const { data, info } = await image
    .clone()
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3)
}

async function processFavicon(body: Buffer): Promise<ProcessedImage> {
  const output = await sharp(body)
    .rotate()
    .resize(FAVICON_SIZE, FAVICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
  return {
    main: { body: output, contentType: 'image/png', extension: 'png', width: FAVICON_SIZE, height: FAVICON_SIZE },
    variants: [],
    blurhash: null,
  }
}

async function processRaster(body: Buffer, animated: boolean): Promise<ProcessedImage> {
  const source = sharp(body, { animated }).rotate()
  const metadata = await source.metadata()
  const sourceWidth = metadata.width ?? MEDIA_MAX_DIMENSION
  const resized = source.clone().resize({
    width: MEDIA_MAX_DIMENSION,
    height: MEDIA_MAX_DIMENSION,
    fit: 'inside',
    withoutEnlargement: true,
  })

  const main = await resized.clone().webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer({ resolveWithObject: true })
  const variantWidths = MEDIA_VARIANT_WIDTHS.filter(width => width < Math.min(sourceWidth, main.info.width))
  const variants = await Promise.all(variantWidths.map(async width => ({
    width,
    body: await source.clone().resize({ width }).webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer(),
  })))

  return {
    main: {
      body: main.data,
      contentType: 'image/webp',
      extension: 'webp',
      width: main.info.width,
      height: animated && main.info.pageHeight ? main.info.pageHeight : main.info.height,
    },
    variants,
    blurhash: animated ? null : await computeBlurhash(resized),
  }
}

async function processUpload(body: Buffer, purpose: MediaPurpose): Promise<ProcessedImage> {
  if (body.byteLength > MEDIA_MAX_BYTES) {
    throw createError({ statusCode: 413, message: 'Files must be 10 MB or smaller.' })
  }

  const mime = await detectType(body)
  if (!mime || !isAccepted(mime)) {
    throw createError({ statusCode: 415, message: 'Upload a JPG, PNG, WebP, AVIF, GIF or SVG image.' })
  }

  if (mime === 'image/svg+xml') {
    if (purpose === 'content') {
      throw createError({ statusCode: 415, message: 'SVG files are only accepted for logos.' })
    }
    return processSvg(body)
  }

  try {
    if (purpose === 'favicon') return await processFavicon(body)
    return await processRaster(body, mime === 'image/gif' || mime === 'image/webp')
  }
  catch (error) {
    console.error('[media] processing failed', error)
    throw createError({ statusCode: 422, message: 'This image could not be processed. Try exporting it again.' })
  }
}

function storagePath(extension: string, suffix = '') {
  const now = new Date()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${now.getUTCFullYear()}/${month}/${crypto.randomUUID()}${suffix}.${extension}`
}

export const mediaService = {
  processUpload,
  storagePath,
}
