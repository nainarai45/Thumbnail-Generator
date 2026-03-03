import React from 'react'
import { thumbnailStyles, type ThumbnailStyle } from '../assets/assets'
import { ChevronDownIcon, CpuIcon, ImageIcon, PenToolIcon, SparkleIcon, SquareIcon } from 'lucide-react';
import { style } from 'motion/react-client';

const StyleSelector = ({value, onChange, isOpen, setIsOpen} : {value: ThumbnailStyle, onChange: (style: ThumbnailStyle) => void; isOpen: boolean; setIsOpen: (isOpen: boolean) => void}) => {
    const styleDescriptions: Record<ThumbnailStyle, string> = {
        'Bold & Graphic': 'High contrast, vibrant colors, and strong typography for maximum impact.',
        'Clean & Minimal': 'Simple layouts, ample white space, and a focus on typography for a modern look.',
        'Illustrative': 'Hand-drawn elements, custom illustrations, and a playful vibe to stand out.',
        'Photo-Centric': 'Large, eye-catching images with minimal text for a visually striking thumbnail.',
        'Text-Heavy': 'Bold typography and layered text effects for thumbnails that rely on messaging.',
    }

    const styleIcons: Record<ThumbnailStyle, React.ReactNode> = {
        'Bold & Graphic': <SparkleIcon className='h-4 w-4'/>,
        'Clean & Minimal': <SquareIcon className='h-4 w-4'/>,
        'Illustrative': <PenToolIcon className='h-4 w-4'/>,
        'Photo-Centric': <ImageIcon className='h-4 w-4'/>,
        'Text-Heavy': <CpuIcon className='h-4 w-4'/>,
    }

    return (
    <div className='relative space-y-3 dark'>
        <label className='block text-sm font-medium text-zinc-200'>Thumbnail Style</label>

        <button type = "button" onClick={() => setIsOpen(!isOpen)} className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition bg-white/10 text-zinc-200 hover:bg-white/12`}>
            <div className='space-y-1'>
                <div className='flex items-center gap-2 font-medium'>
                    {styleIcons[value]}
                    <span>{value}</span>
                </div>
                    <p className='text-xs text-zinc-400'>{styleDescriptions[value]}</p>
                </div>
        
            <ChevronDownIcon className={['h-5 w-5 text-zinc-400 transition-transform', isOpen && 'rotate-180'].join(' ')} />
        </button>

        {isOpen && (
            <div className='absolute bottom-0 z-50 mt-1 w-full rounded-md border-white/12 bg-black/20 backdrop-blur-3xl shadow-lg'>
                {thumbnailStyles.map((style) => (
                    <button key={style}
                    type='button' 
                    onClick={() => {onChange(style); setIsOpen(false);}} 
                    className='flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-black/30'>
                        <div className='mt-0.5'>{styleIcons[style]}</div>
                        <div>
                            <p className='font-medium'>{style}</p>
                            <p className='text-xs text-zinc-400'>{styleDescriptions[style]}</p>
                        </div>
                    </button>
                    ))}
            </div>
        )}
    </div>
    )
}

export default StyleSelector