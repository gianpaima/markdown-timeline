export interface TimelinePluginSettings {
    defaultView: string;
    timelineOrder: 'asc' | 'desc';
    showHeaderButtons: boolean;
    dateFormat: string;
}

export const DEFAULT_SETTINGS: TimelinePluginSettings = {
    defaultView: 'timeline',
    timelineOrder: 'asc',
    showHeaderButtons: true,
    dateFormat: 'YYYY-MM-DD'
};

export interface TimelineEvent {
    year: string;
    month?: string;
    day?: string;
    title: string;
    /** Optional list of tags (e.g. ['#tag1', '#tag2']) */
    tags?: string[];
    content: string;
}

export interface TimelineError {
    message: string;
    type: 'parse' | 'validation' | 'render';
    details?: string;
    line?: number;
}

export class TimelineValidationError extends Error {
    constructor(
        message: string,
        public type: TimelineError['type'] = 'validation',
        public details?: string,
        public line?: number
    ) {
        super(message);
        this.name = 'TimelineValidationError';
    }
} 