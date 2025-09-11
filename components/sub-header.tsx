'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { IoArrowBack } from 'react-icons/io5'

interface SubHeaderProps {
    title: string
    showBackButton?: boolean
    onBackClick?: () => void
}

const SubHeader: React.FC<SubHeaderProps> = ({
    title,
    showBackButton = true,
    onBackClick
}) => {
    const router = useRouter()

    const handleBackClick = () => {
        if (onBackClick) {
            onBackClick()
        } else {
            router.back()
        }
    }

    return (
        <div className="w-full h-[6vh] flex items-center justify-between px-4 bg-white border-b border-gray-100">
            {showBackButton ? (
                <button
                    className="text-2xl text-gray-600 hover:text-gray-800 p-1"
                    onClick={handleBackClick}
                    aria-label="戻る"
                >
                    <IoArrowBack />
                </button>
            ) : (
                <div className="w-8" />
            )}
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <div className="w-8" /> {/* スペーサー */}
        </div>
    )
}

export default SubHeader
