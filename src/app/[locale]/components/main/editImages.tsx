'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { API_URL } from '@/lib/config'
import { useError } from '@/context/ErrorContext'
import { useInfo } from '@/context/infoContext'

interface EditImagesProps {
    pageId: number
    sectionId: number
}

interface FrontImage {
    id: number
    pageId: number
    sectionId: number
    path: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.webp'

export default function EditImages({ pageId, sectionId }: EditImagesProps) {
    const { setError } = useError()
    const { setInfo } = useInfo()

    const [currentImage, setCurrentImage] = useState<FrontImage | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const inputId = `editImages-${pageId}-${sectionId}`

    // Load the image currently assigned to this page/section
    useEffect(() => {
        let ignore = false
        const loadCurrentImage = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(
                    `${API_URL}/api/contentManager?pageId=${pageId}&sectionId=${sectionId}`,
                    { cache: 'no-store' }
                )
                if (!res.ok) throw new Error()
                const data: FrontImage[] = await res.json()
                if (!ignore) setCurrentImage(data[0] ?? null)
            } catch {
                if (!ignore) setCurrentImage(null)
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }
        loadCurrentImage()
        return () => {
            ignore = true
        }
    }, [pageId, sectionId])

    // Release the object URL whenever it's replaced or the component unmounts
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (!selected) return

        if (selected.size > MAX_FILE_SIZE) {
            setError('La imagen supera el límite de 5MB.')
            e.target.value = ''
            return
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setFile(selected)
        setPreviewUrl(URL.createObjectURL(selected))
    }

    const handleCancel = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setFile(null)
        setPreviewUrl(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    const handleSave = async () => {
        if (!file) return
        setIsSaving(true)
        try {
            const formData = new FormData()
            formData.append('file', file, file.name)
            formData.append('pageId', String(pageId))
            formData.append('sectionId', String(sectionId))

            const uploadRes = await fetch(`${API_URL}/api/contentManager/upload`, {
                method: 'POST',
                body: formData,
            })

            if (!uploadRes.ok) {
                const message = await uploadRes.text()
                throw new Error(message || 'Error al subir la imagen.')
            }

            const { path }: { path: string } = await uploadRes.json()

            setCurrentImage({ id: currentImage?.id ?? 0, pageId, sectionId, path })
            handleCancel()
            setInfo('Imagen actualizada correctamente')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error al guardar la imagen.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="w-full max-w-xs mx-auto font-fredoka">
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-800 border border-blue-700">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        Cargando...
                    </div>
                ) : previewUrl ? (
                    // Local preview of the just-selected file: a blob: URL can't be routed
                    // through next/image's optimizer, so a plain <img> is used here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Previsualización" className="w-full h-full object-cover" />
                ) : currentImage ? (
                    <Image
                        src={currentImage.path}
                        alt="Imagen actual"
                        fill
                        sizes="320px"
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm text-center px-2">
                        Sin imagen
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                id={inputId}
                onChange={handleFileChange}
                accept={ACCEPTED_TYPES}
                className="hidden"
            />

            <div className="flex gap-2 mt-3">
                <label
                    htmlFor={inputId}
                    className="flex-1 cursor-pointer text-center py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                >
                    {file ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </label>

                {file && (
                    <>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-hidden focus:ring-2 focus:ring-green-500 transition disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSaving}
                            aria-label="Cancelar selección"
                            className="py-2 px-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-hidden focus:ring-2 focus:ring-gray-500 transition disabled:opacity-50"
                        >
                            ✕
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
