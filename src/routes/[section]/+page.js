import { error } from '@sveltejs/kit';

export function load({ params }) {
    const validSections = ['skills', 'experience', 'projects'];

    if (!validSections.includes(params.section)) {
        throw error(404, 'Section not found');
    }

    return {
        section: params.section
    };
}
