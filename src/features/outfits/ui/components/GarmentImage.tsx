import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../../infrastructure/database/db'

interface GarmentImageProps {
  imageId: string
  alt: string
  className?: string
}

export default function GarmentImage({ imageId, alt, className }: GarmentImageProps) {
  const image = useLiveQuery(() => db.garmentImages.get(imageId), [imageId])
  const [objectUrl, setObjectUrl] = useState<string>()

  useEffect(() => {
    if (!image?.blob) {
      setObjectUrl(undefined)
      return
    }

    const url = URL.createObjectURL(image.blob)
    setObjectUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [image])

  if (!objectUrl) {
    return (
      <div
        className={[
          'flex items-center justify-center bg-violet-50 text-2xl text-violet-300 dark:bg-violet-500/10 dark:text-violet-400',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={alt}
      >
        ◇
      </div>
    )
  }

  return <img src={objectUrl} alt={alt} className={className} />
}
