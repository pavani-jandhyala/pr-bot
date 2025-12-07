// .github/scripts/review.ts

import { Octokit } from '@octokit/rest';
import { readFileSync } from 'fs';
// ➡️ CHANGE: Import the GoogleGenAI SDK instead of OpenAI
import { GoogleGenAI } from '@google/genai'; 

// --- Configuration ---
const GUIDELINES_FILE_PATH = 'CODING_GUIDELINES.md'; 
// ➡️ CHANGE: Using a capable Gemini model
const MODEL_NAME = 'gemini-2.5-flash'; 
const BOT_NAME = 'AI Code Reviewer (Powered by Gemini)';

// --- Environment Variables from GitHub Actions ---
// ➡️ CHANGE: Expecting LLM_API_KEY from GitHub secrets
const LLM_API_KEY = process.env.LLM_API_KEY!; 
const PR_NUMBER = parseInt(process.env.PR_NUMBER!, 10);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPOSITORY = process.env.GITHUB_REPOSITORY!;

// Derive owner and repo from the GITHUB_REPOSITORY variable
const [OWNER, REPO] = REPOSITORY.split('/');

// Initialize clients
const octokit = new Octokit({ auth: GITHUB_TOKEN });
// ➡️ CHANGE: Initialize the GoogleGenAI client
const ai = new GoogleGenAI({ 
    apiKey: LLM_API_KEY 
}); 

// --- Interface for Structured AI Output ---
interface ReviewComment {
    path: string;
    position: number;
    body: string;
}

interface AIReviewOutput {
    summary: string;
    comments: ReviewComment[];
}

/**
 * 1. Defines the persona and instructions for the AI model.
 * 2. Instructs the AI to output the suggestions in the required JSON format.
 */
function createSystemPrompt(guidelines: string): string {
  return `
    You are an expert ${BOT_NAME}. Your role is to perform a detailed, professional, and constructive code review.
    
    You MUST adhere strictly to the following instructions:
    
    1.  **Review Focus:** Prioritize security, performance, correctness, and adherence to the team coding guidelines.
    2.  **Guidelines:** The team's guidelines are enclosed in <GUIDELINES> tags below. Use them as the primary source for style and convention checks.
        <GUIDELINES>
        ${guidelines}
        </GUIDELINES>
    3.  **Output Format:** You MUST output a single, structured JSON object with two fields: 'summary' and 'comments'.
        -   'summary': A brief, overall markdown comment for the PR summary.
        -   'comments': An array of objects, where each object represents an **inline review comment**.
    4.  **Inline Comment Structure:** Each comment object MUST have the fields: 'path', 'position', and 'body'.
        -   'path': The file path of the change (e.g., 'src/index.ts').
        -   'position': The line number of the change *within the diff hunk* to comment on (a positive integer).
    
    Example JSON Output:
    {
      "summary": "### ⚠️ Review Feedback\\nFound a potential security vulnerability. Please review my inline comments.\\n",
      "comments": [
        {
          "path": "src/auth.ts",
          "position": 42,
          "body": "Security: This approach is vulnerable to timing attacks. Consider using a constant-time comparison."
        }
      ]
    }
    
    If no issues are found, the 'comments' array should be empty, and the 'summary' should be a positive message (e.g., "LGTM!").
  `;
}

/**
 * Fetches the pull request diff from GitHub using the Octokit REST API.
 */
async function fetchPrDiff(prNumber: number): Promise<string> {
  console.log(`Fetching diff for PR #${prNumber} from ${OWNER}/${REPO} via Octokit...`);
  try {
    const { data } = await octokit.pulls.get({
      owner: OWNER,
      repo: REPO,
      pull_number: prNumber,
      mediaType: {
        format: 'diff',
      },
    });
    return data as unknown as string;
  } catch (error) {
    console.error(`Error fetching PR diff for #${prNumber}:`, error);
    throw new Error('Failed to fetch pull request diff from GitHub API.');
  }
}

/**
 * Calls the Gemini model for the code review.
 */
async function getAiReview(diff: string, guidelines: string): Promise<AIReviewOutput> {
  const systemPrompt = createSystemPrompt(guidelines);
  
  console.log(`Sending diff to ${MODEL_NAME} for review...`);

  try {
    // ➡️ CHANGE: Use the GoogleGenAI generateContent method
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: `System Instruction:\n${systemPrompt}\n\nReview the following code diff:\n\n${diff}` }] }],
        config: {
            // Set the response format to JSON
            responseMimeType: "application/json",
            temperature: 0.2, // Lower temperature for deterministic analysis
        },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error('AI returned an empty response.');
    }
    
    // Parse and validate the JSON output
    const reviewData = JSON.parse(jsonText);
    if (!reviewData.summary || !Array.isArray(reviewData.comments)) {
        throw new Error("AI response structure is invalid. Missing 'summary' or 'comments' field.");
    }
    
    return reviewData as AIReviewOutput;
    
  } catch (error) {
    console.error('Error during AI model call:', error);
    return {
        summary: `⚠️ **AI Review Failed:** Could not get a response from the Gemini model or invalid JSON format. Check Action logs.`,
        comments: []
    };
  }
}

/**
 * Posts the structured review back to the GitHub PR.
 */
async function postReview(prNumber: number, review: AIReviewOutput) {
    console.log(`Posting ${review.comments.length} inline comments and summary...`);
    
    const comments = review.comments.map(c => ({
        ...c,
    }));

    await octokit.pulls.createReview({
        owner: OWNER,
        repo: REPO,
        pull_number: prNumber,
        body: review.summary,
        event: comments.length > 0 ? 'COMMENT' : 'APPROVE',
        comments: comments,
    });
    
    console.log('Review posted successfully!');
}

/**
 * Main execution function.
 */
async function main() {
  try {
    // ➡️ Check for the new LLM_API_KEY environment variable
    if (!LLM_API_KEY || !PR_NUMBER || !GITHUB_TOKEN || !REPOSITORY) {
      throw new Error('Missing environment variables. Check LLM_API_KEY, PR_NUMBER, GITHUB_TOKEN, and GITHUB_REPOSITORY.');
    }

    const guidelines = readFileSync(GUIDELINES_FILE_PATH, 'utf-8');
    const prDiff = await fetchPrDiff(PR_NUMBER);
    const aiReview = await getAiReview(prDiff, guidelines);
    await postReview(PR_NUMBER, aiReview);

  } catch (error) {
    console.error(`🔴 AI Review Bot Failed:`, error);
    if (PR_NUMBER) {
        await octokit.issues.createComment({
            owner: OWNER,
            repo: REPO,
            issue_number: PR_NUMBER,
            body: `## 🔴 AI Review Bot Failure\nI encountered an error while running the review: \`${(error as Error).message}\`.\nPlease check the Action logs for details.`,
        });
    }
    process.exit(1);
  }
}

main();