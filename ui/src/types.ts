export interface LessonCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  mission: string;
  culturalNote: string;
}

export const LESSON_CATEGORIES: LessonCategory[] = [
  {
    id: 'basics-greetings',
    name: 'Greetings & Being',
    description: 'Learn how to say hello and use the verb Ser.',
    icon: 'MessageCircle',
    level: 0,
    mission: 'Saluda a Mateo y preséntate.',
    culturalNote: 'In Spanish, "Ser" is used for permanent traits like your name or nationality.'
  },
  {
    id: 'basics-wants',
    name: 'Wants & Needs',
    description: 'Learn how to express what you want (Querer).',
    icon: 'Sparkles',
    level: 0,
    mission: 'Dile a Mateo lo que quieres beber.',
    culturalNote: 'Spanish speakers are very direct; "Yo quiero" is common and not considered rude.'
  },
  {
    id: 'basics-verbs',
    name: 'Action! Verbs',
    description: 'Master basic -ar verbs in the present tense.',
    icon: 'Zap',
    level: 1,
    mission: 'Practica hablar de lo que haces hoy.',
    culturalNote: 'Spanish verbs change their ending depending on who is doing the action.'
  },
  {
    id: 'cafe',
    name: 'El Café',
    description: 'Order your favorite coffee and pastries.',
    icon: 'Coffee',
    level: 2,
    mission: 'Pide un café con leche y un croissant.',
    culturalNote: 'Si pides un "cortado", recibirás un espresso con una pequeña cantidad de leche tibia.'
  }
];

export interface UserProgress {
  userId: string;
  currentCategoryId: string;
  completedCategories: string[];
  totalTimeSpoken: number; // in seconds
  streak: number;
}
