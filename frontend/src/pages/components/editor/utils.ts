export function extract_task(input: string) {
    // Extract JavaScript code using regular expressions
    const jsCodeRegex = /```javascript\n([\s\S]*?)\n```/g;
    const jsCodeMatches = [...input.matchAll(jsCodeRegex)];
    const jsCode = jsCodeMatches.map(match => match[1]).join('\n');

    // Extract title and question
    const titleRegex = /Title: (.*)\n/;
    const questionRegex = /Question:\n([\s\S]*?)\n```/;
    const titleMatch = input.match(titleRegex);
    const questionMatch = input.match(questionRegex);

    const title = titleMatch ? titleMatch[1] : '';
    const question = questionMatch ? questionMatch[1] : '';

    // Remove the solution section from content
    const solutionRegex = /\*\*Solution\*\*[\s\S]*$/;
    const contentWithoutSolution = input.replace(solutionRegex, '');
    return [title, question, jsCode, contentWithoutSolution];
}
