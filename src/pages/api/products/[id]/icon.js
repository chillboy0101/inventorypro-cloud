import { supabase } from '../../../../lib/supabase';
import formidable from 'formidable';
import fs from 'fs';
export const config = {
    api: {
        bodyParser: false,
    },
};
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { id } = req.query;
    try {
        const form = formidable({});
        const [fields, files] = await form.parse(req);
        const file = files.icon?.[0];
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Upload file to Supabase Storage
        const fileBuffer = await fs.promises.readFile(file.filepath);
        const fileName = `${id}-${Date.now()}-${file.originalFilename}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-icons')
            .upload(fileName, fileBuffer, {
            contentType: file.mimetype || 'image/jpeg',
        });
        if (uploadError) {
            throw uploadError;
        }
        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
            .from('product-icons')
            .getPublicUrl(fileName);
        // Update product with new icon URL
        const { error: updateError } = await supabase
            .from('products')
            .update({
            custom_icon: publicUrl,
            custom_icon_type: 'custom',
        })
            .eq('id', id);
        if (updateError) {
            throw updateError;
        }
        return res.status(200).json({ iconUrl: publicUrl });
    }
    catch (error) {
        console.error('Error handling icon upload:', error);
        return res.status(500).json({ error: 'Failed to upload icon' });
    }
}
