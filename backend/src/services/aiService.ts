import OpenAI from 'openai';
import { IAssignment } from '../models/Assignment';
import { ISection, IQuestion } from '../models/QuestionPaper';
import { v4 as uuidv4 } from 'uuid';

const getClient = () => ({
  client: new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  }),
  model: 'llama-3.3-70b-versatile',
});

interface ParsedPaper {
  title: string;
  sections: ISection[];
  totalMarks: number;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: 'Multiple Choice Questions (MCQ)',
  short_answer: 'Short Answer Questions',
  long_answer: 'Long Answer / Essay Questions',
  true_false: 'True or False Questions',
  fill_in_blank: 'Fill in the Blank Questions',
};

function buildPrompt(assignment: IAssignment): string {
  const questionBreakdown = assignment.questionTypes
    .map((qt) => `  - ${QUESTION_TYPE_LABELS[qt.type]}: ${qt.count} questions × ${qt.marksPerQuestion} marks each`)
    .join('\n');

  const sections = assignment.questionTypes
    .map((qt, idx) => {
      const sectionLabel = String.fromCharCode(65 + idx);
      return `Section ${sectionLabel}: ${qt.count} ${QUESTION_TYPE_LABELS[qt.type]} (${qt.marksPerQuestion} marks each)`;
    })
    .join('\n');

  return `You are an expert educator creating a structured question paper for students.

Create a complete question paper with the following specifications:

**Subject:** ${assignment.subject}
**Grade/Class:** ${assignment.grade}
**Title:** ${assignment.title}
**Total Marks:** ${assignment.totalMarks}
${assignment.duration ? `**Duration:** ${assignment.duration} minutes` : ''}

**Question Distribution:**
${questionBreakdown}

**Sections to create:**
${sections}

${assignment.additionalInstructions ? `**Additional Instructions from teacher:**\n${assignment.additionalInstructions}` : ''}

${assignment.fileContent ? `**Reference Material:**\n${assignment.fileContent.substring(0, 2000)}` : ''}

---

IMPORTANT: Return ONLY valid JSON in the exact format below. No markdown, no explanation, no code blocks.

{
  "title": "Question Paper Title",
  "sections": [
    {
      "id": "section-a",
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "totalMarks": 20,
      "questions": [
        {
          "id": "q1",
          "number": 1,
          "text": "Question text here?",
          "type": "mcq",
          "difficulty": "easy",
          "marks": 2,
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option A"
        }
      ]
    }
  ],
  "totalMarks": ${assignment.totalMarks}
}

Rules:
1. Each section corresponds to one question type
2. difficulty must be "easy", "medium", or "hard" — distribute evenly across questions
3. For MCQ: always include "options" array with exactly 4 items and "answer"
4. For true_false: options should be ["True", "False"]
5. For fill_in_blank: use "_____" in the question text
6. Questions must be relevant to ${assignment.subject} for Grade ${assignment.grade} students
7. Make questions educationally appropriate and clear
8. Generate exactly the number of questions specified
9. Section titles: "Section A", "Section B", etc.
10. Return ONLY the JSON object, nothing else`;
}

function parseAIResponse(raw: string): ParsedPaper {
  let jsonStr = raw.trim();

  // Remove markdown code blocks if present
  jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');

  // Find JSON object boundaries
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    jsonStr = jsonStr.substring(start, end + 1);
  }

  const parsed = JSON.parse(jsonStr);

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid response: missing sections array');
  }

  const sections: ISection[] = parsed.sections.map((sec: any) => ({
    id: sec.id || uuidv4(),
    title: sec.title || 'Section',
    instruction: sec.instruction || 'Attempt all questions.',
    totalMarks: sec.totalMarks || 0,
    questions: (sec.questions || []).map((q: any, idx: number) => ({
      id: q.id || uuidv4(),
      number: q.number || idx + 1,
      text: q.text || '',
      type: q.type || 'short_answer',
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      marks: q.marks || 1,
      options: q.options || undefined,
      answer: q.answer || undefined,
    } as IQuestion)),
  }));

  return {
    title: parsed.title || 'Question Paper',
    sections,
    totalMarks: parsed.totalMarks || 0,
  };
}

export async function generateQuestionPaper(assignment: IAssignment): Promise<ParsedPaper> {
  const prompt = buildPrompt(assignment);
  const { client, model } = getClient();

  console.log(`🤖 Using model: ${model}`);

  const completion = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: 'You are an expert educator. Always respond with valid JSON only. No markdown, no explanation.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from AI');

  return parseAIResponse(text);
}
