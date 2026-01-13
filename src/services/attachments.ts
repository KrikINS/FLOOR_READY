import { supabase } from './supabase';
import type { TaskAttachment } from '../types';

export const attachmentsService = {
    async uploadAttachment(
        file: File,
        taskId: string,
        userId: string,
        context: 'creation' | 'submission' | 'comment'
    ): Promise<TaskAttachment> {

        // 1. Validations
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        const ALLOWED_TYPES = [
            'image/jpeg', 'image/png', 'image/webp', // Images
            'application/pdf', // PDF
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Excel
        ];

        if (file.size > MAX_SIZE) {
            throw new Error('File size exceeds 10MB limit.');
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error('Invalid file type. Only Images and MS Office docs allowed.');
        }

        // 2. Upload to Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${taskId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 3. Create DB Record
        const { data, error: dbError } = await supabase
            .from('task_attachments')
            .insert({
                task_id: taskId,
                file_name: file.name,
                file_path: filePath,
                file_type: file.type,
                file_size: file.size,
                uploaded_by: userId,
                context: context
            })
            .select()
            .single();

        if (dbError) throw dbError;
        return data as TaskAttachment;
    },

    async getAttachments(taskId: string): Promise<TaskAttachment[]> {
        const { data, error } = await supabase
            .from('task_attachments')
            .select('*')
            .eq('task_id', taskId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as TaskAttachment[];
    },

    getPublicUrl(filePath: string): string {
        const { data } = supabase.storage
            .from('task-attachments')
            .getPublicUrl(filePath);
        return data.publicUrl;
    }
};
