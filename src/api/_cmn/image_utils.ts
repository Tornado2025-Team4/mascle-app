// 画像処理のためのユーティリティ関数

import { SupabaseClient } from '@supabase/supabase-js';

export interface ImageUploadResult {
    fileId: string;
    fileName: string;
    contentType: string;
}

// サポートされている画像フォーマット
export const SUPPORTED_IMAGE_FORMATS = {
    'image/jpeg': { extension: 'jpg', contentType: 'image/jpeg' },
    'image/jpg': { extension: 'jpg', contentType: 'image/jpeg' },
    'image/png': { extension: 'png', contentType: 'image/png' },
    'image/webp': { extension: 'webp', contentType: 'image/webp' }
} as const;

/**
 * Base64データから画像フォーマットを検出
 */
export function detectImageFormat(base64Data: string): { contentType: string; extension: string } {
    const match = base64Data.match(/^data:image\/([a-zA-Z]+);base64,/);
    if (!match) {
        throw new Error('Invalid base64 image data');
    }

    const mimeType = `image/${match[1].toLowerCase()}`;
    const format = SUPPORTED_IMAGE_FORMATS[mimeType as keyof typeof SUPPORTED_IMAGE_FORMATS];

    if (!format) {
        throw new Error(`Unsupported image format: ${mimeType}. Supported formats: ${Object.keys(SUPPORTED_IMAGE_FORMATS).join(', ')}`);
    }

    return {
        contentType: format.contentType,
        extension: format.extension
    };
}

/**
 * Base64画像データを処理し、バッファとメタデータを返す
 */
export function processBase64Image(base64Data: string, maxSizeBytes: number = 10 * 1024 * 1024) {
    const { contentType, extension } = detectImageFormat(base64Data);

    // Base64データからprefixを削除
    const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length > maxSizeBytes) {
        throw new Error(`Image is too large (${(buffer.length / 1024 / 1024).toFixed(2)}MB). Maximum size is ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`);
    }

    return {
        buffer,
        contentType,
        extension
    };
}

/**
 * 画像ファイルをSupabaseストレージにアップロード
 */
export async function uploadImageToStorage(
    supabaseClient: SupabaseClient,
    bucketName: string,
    buffer: Buffer,
    contentType: string,
    extension: string,
    customFileName?: string
): Promise<ImageUploadResult> {
    const fileName = customFileName || `${crypto.randomUUID()}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from(bucketName)
        .upload(fileName, buffer, {
            contentType,
            upsert: false
        });

    if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const fileId = uploadData?.id;
    if (!fileId) {
        throw new Error('Failed to get uploaded file ID');
    }

    return {
        fileId,
        fileName,
        contentType
    };
}

/**
 * ストレージから署名付きURLを生成
 */
export async function createSignedUrl(
    supabaseClient: SupabaseClient,
    bucketName: string,
    fileName: string,
    expiresInSeconds: number = 3600
): Promise<string | null> {
    try {
        const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
            .from(bucketName)
            .createSignedUrl(fileName, expiresInSeconds);

        if (signedUrlError || !signedUrlData?.signedUrl) {
            console.error(`Failed to create signed URL for ${bucketName}/${fileName}:`, signedUrlError);
            return null;
        }

        return signedUrlData.signedUrl;
    } catch (error) {
        console.error(`Error creating signed URL for ${bucketName}/${fileName}:`, error);
        return null;
    }
}

/**
 * ストレージオブジェクトIDからファイル名を取得
 */
export async function getFileNameFromStorageId(
    supabaseClient: SupabaseClient,
    storageId: string
): Promise<string | null> {
    try {
        const { data: storageData, error: storageError } = await supabaseClient
            .from('storage.objects')
            .select('name')
            .eq('id', storageId)
            .single();

        if (storageError || !storageData?.name) {
            console.error(`Failed to get filename for storage ID ${storageId}:`, storageError);
            return null;
        }

        return storageData.name;
    } catch (error) {
        console.error(`Error getting filename for storage ID ${storageId}:`, error);
        return null;
    }
}

/**
 * ストレージオブジェクトIDから署名付きURLを生成
 */
export async function createSignedUrlFromStorageId(
    supabaseClient: SupabaseClient,
    bucketName: string,
    storageId: string,
    expiresInSeconds: number = 3600
): Promise<string | null> {
    const fileName = await getFileNameFromStorageId(supabaseClient, storageId);
    if (!fileName) {
        return null;
    }

    return createSignedUrl(supabaseClient, bucketName, fileName, expiresInSeconds);
}
