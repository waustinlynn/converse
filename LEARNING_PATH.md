# Language Learning Curriculum: The "Foundation-First" Journey

This curriculum focuses on building a solid base through friendly conversation, using a mix of English and Spanish ("Spanglish") that gradually shifts toward full immersion.

## 1. The Pedagogy: "Learning from a Friend"

### Phase 1: The Foundation (A0 - A1)
*   **Tone:** 70% English / 30% Spanish.
*   **Focus:** Core building blocks (Common Nouns, "Super Verbs" like *Ser, Estar, Tener, Ir*).
*   **Interaction:** Mateo explains a concept in English, gives examples in Spanish, and invites the user to repeat or use them in a sentence.

### Phase 2: Building Sentences (A1 - A2)
*   **Tone:** 40% English / 60% Spanish.
*   **Focus:** Simple Tenses (Present, Immediate Future), connecting words, and everyday objects.
*   **Interaction:** Simple roleplays (ordering food, describing your room).

### Phase 3: Conversational Flow (B1+)
*   **Tone:** 10% English / 90% Spanish.
*   **Focus:** Past tenses, expressing opinions, and complex sentence structures.
*   **Interaction:** Deep immersion, cultural debates, and storytelling.

---

## 2. Updated Module Hierarchy

### Stage 0: Las Bases (The Basics)
*   **Mission 0.1: Greetings & Being.** Goal: Learn "Hola" and the verb "Ser" (to be).
*   **Mission 0.2: Having & Wanting.** Goal: Learn "Tener" and "Querer" for basic needs.
*   **Mission 0.3: Action!** Goal: Common -ar/-er/-ir verbs in the present tense.

### Stage 1: Survival Spanish
*   **Mission 1.1: The Café.** (Previously Stage 1)
*   **Mission 1.2: Directions.**
...

---

## 2. DynamoDB Data Mapping

We store this in our Single-Table design to make the AI "aware" of the user's history.

| Entity | SK | Attributes |
| :--- | :--- | :--- |
| **Progress** | `LANG#SPANISH` | `{ "current_mission": "1.2", "total_xp": 450, "unlocked_stages": [1, 2] }` |
| **Mission Result** | `MISSION#1.1` | `{ "score": 92, "accuracy": 0.85, "last_attempt": "2026-05-17" }` |
| **Vocabulary** | `WORD#CAFE` | `{ "mastery": 5, "context": "Ordered at a shop" }` |

---

## 3. The "Context Injection" Strategy

When the user connects, the backend fetches the `LANG#SPANISH` and the latest `MISSION#` items. We inject this into the `systemInstruction`:

### Example Prompt Injection:
> "The user is currently on **Mission 1.2 (Numbers & Coffee)**. 
> They successfully completed **Mission 1.1** with a 92% score.
> Their vocabulary mastery is strong on 'Hola' and 'Gracias', but weak on 'La cuenta' (the bill). 
> Focus the conversation on ordering drinks and ensure they practice 'La cuenta'."

---

## 4. Moving Forward & Back

*   **Moving Forward:** Triggered when `Mission Result.score` > 80. The backend updates `Progress.current_mission` to the next ID.
*   **Review Mode (Moving Back):** The user can select any previous mission from the UI. The AI is informed: "The user is reviewing a past mission. Be supportive and see if their fluency has improved since their last score of X."

---

## 5. Next Implementation Steps

1.  **Define `missions.json`**: A static file containing the metadata for all missions (title, target phrases, goal).
2.  **Repository Layer**: Build the `UserRepository` to fetch this data from DynamoDB.
3.  **Prompt Builder**: Create a utility that assembles the complex `systemInstruction` string based on the user's DB profile.
