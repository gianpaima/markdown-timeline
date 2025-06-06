import { TimelineEvent, TimelineValidationError } from '../types';

function validateDate(year: string, month?: string, day?: string, lineNumber?: number) {
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) {
        throw new TimelineValidationError(
            'Invalid year format',
            'validation',
            `Year "${year}" is not a valid number`,
            lineNumber
        );
    }

    if (month) {
        const monthNum = parseInt(month);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            throw new TimelineValidationError(
                'Invalid month format',
                'validation',
                `Month "${month}" should be between 1 and 12`,
                lineNumber
            );
        }

        if (day) {
            const dayNum = parseInt(day);
            // Use absolute year for date validation since negative years aren't supported by Date
            const absYear = Math.abs(yearNum);
            const daysInMonth = new Date(absYear, monthNum, 0).getDate();
            if (isNaN(dayNum) || dayNum < 1 || dayNum > daysInMonth) {
                throw new TimelineValidationError(
                    'Invalid day format',
                    'validation',
                    `Day "${day}" is not valid for month ${month}`,
                    lineNumber
                );
            }
        }
    }
}

export function parseTimelineContent(content: string): TimelineEvent[] {
    if (!content.trim()) {
        throw new TimelineValidationError(
            'Empty timeline content',
            'parse',
            'Please provide some timeline events'
        );
    }

    const events: TimelineEvent[] = [];
    const sections = content.split('---').filter(section => section.trim());

    if (sections.length === 0) {
        throw new TimelineValidationError(
            'No timeline events found',
            'parse',
            'Timeline should contain at least one event separated by ---'
        );
    }

    let currentLineNumber = 1;
    sections.forEach(section => {
        const lines = section.trim().split('\n');
        const currentEvent: Partial<TimelineEvent> = {};
        const contentLines: string[] = [];

        let foundDate = false;
        let foundTitle = false;
        let tagsParsed = false;
        const sectionStartLine = currentLineNumber;

        lines.forEach(line => {
            line = line.trim();
            if (!foundDate && line.startsWith('# ')) {
                const dateStr = line.replace('# ', '');

                // Handle negative years in the date format
                let dateParts: string[];
                if (dateStr.startsWith('-')) {
                    // For negative years, keep the minus sign with the year
                    const yearPart = dateStr.substring(0, dateStr.indexOf('-', 1) === -1 ?
                        dateStr.length : dateStr.indexOf('-', 1));
                    const restPart = dateStr.substring(yearPart.length);
                    dateParts = [yearPart, ...restPart.split('-').filter(p => p)];
                } else {
                    dateParts = dateStr.split('-');
                }

                if (dateParts.length === 0 || dateParts.length > 3) {
                    throw new TimelineValidationError(
                        'Invalid date format',
                        'parse',
                        'Date should be in format: # [-]YYYY[-MM[-DD]], supports negative years for BC events',
                        currentLineNumber
                    );
                }

                currentEvent.year = dateParts[0];
                if (dateParts.length > 1) {
                    currentEvent.month = dateParts[1];
                }
                if (dateParts.length > 2) {
                    currentEvent.day = dateParts[2];
                }

                validateDate(
                    currentEvent.year,
                    currentEvent.month,
                    currentEvent.day,
                    currentLineNumber
                );

                foundDate = true;
            } else if (foundDate && !foundTitle && !tagsParsed && line.startsWith('#') && !line.startsWith('# ') && !line.startsWith('## ')) {
                const tags = line.split(/\s+/).filter(t => t.startsWith('#'));
                if (tags.length) {
                    currentEvent.tags = tags;
                    tagsParsed = true;
                }
            } else if (!foundTitle && line.startsWith('## ')) {
                currentEvent.title = line.replace('## ', '').trim();
                if (!currentEvent.title) {
                    throw new TimelineValidationError(
                        'Empty title',
                        'parse',
                        'Event title cannot be empty',
                        currentLineNumber
                    );
                }
                foundTitle = true;
            } else if (line) {
                contentLines.push(line);
            }
            currentLineNumber++;
        });

        if (!foundDate) {
            throw new TimelineValidationError(
                'Missing date',
                'parse',
                'Each event must start with a date (# YYYY[-MM[-DD]])',
                sectionStartLine
            );
        }

        if (!foundTitle) {
            throw new TimelineValidationError(
                'Missing title',
                'parse',
                'Each event must have a title (## Title)',
                sectionStartLine
            );
        }

        if (contentLines.length === 0) {
            throw new TimelineValidationError(
                'Missing content',
                'parse',
                'Each event must have some content',
                sectionStartLine
            );
        }

        currentEvent.content = contentLines.join('\n');
        events.push(currentEvent as TimelineEvent);
        currentLineNumber++; // Account for the separator
    });

    return events;
} 