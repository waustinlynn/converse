/**
 * Domain Entity for a Learning Session
 */
export class Session {
    constructor(
        public readonly sessionId: string,
        public readonly categoryId: string,
        public readonly createdAt: Date = new Date()
    ) {}
}

/**
 * Domain Value Object for Language Level
 */
export enum LanguageLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced'
}

/**
 * User Progress Domain Model
 */
export interface Progress {
    totalTimeSpent: number;
    completedLessons: string[];
    streak: number;
}
