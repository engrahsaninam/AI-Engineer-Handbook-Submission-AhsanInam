# Caprae Submission Checklist

## Requirements From The Handbook

- GitHub repository containing all relevant code.
- `README.md` with setup instructions.
- Dataset if permissible. This project is stateless and does not require a dataset; sample outputs can be generated through the UI/API.
- 1-2 minute video walkthrough explaining the project, value generated, decisions made, and results.
- Optional demo link, Jupyter walkthrough, or API demonstration.
- Business understanding answers:
  - What is Caprae's mission?
  - Why do you want to work at Caprae Capital?
  - How is Caprae changing the ETA space and broader PE?
- Brief employment/logistics answers:
  - Current US working status.
  - Willing and able to work at least 40 hours/week.
  - Why Caprae Capital?
  - Expected salary.
  - Confirmation of probation, working hours, off-hours availability, and start expectations.
- Up-to-date resume.
- Email to `recruiting@capraecapital.com`.
- Subject line format: `{Role Title} - Handbook Submission - {Your Name}`.

## Repository Readiness

- `README.md` explains setup, architecture, AI usage, testing, hosting, and security.
- `.env.example` shows required env vars without exposing secrets.
- `.gitignore` excludes `.env`, logs, and `node_modules/`.
- Tests pass with `npm.cmd test`.
- The app runs locally at `http://localhost:3000/` with `npm.cmd run dev`.
- The deployed app should use Vercel production with `OPENAI_API_KEY` configured in Project Environment Variables.

## Video Walkthrough Outline

1. Problem: SaaSQuatch already enriches and generates outreach, but sales users still need to decide which websites deserve attention and what angle to use.
2. Feature: AI Web Scanner turns a public website into an account brief with score, grade, buying signals, pain hypotheses, outreach context, and handoff/export actions.
3. Architecture: Next.js route handler fetches public pages, extracts readable text, runs deterministic signal scoring, then uses OpenAI server-side for richer recommendations with fallback if AI is unavailable.
4. Demo: scan `xsol.ai`, show `AI Enhanced`, score/grade, signals, outreach context, and export buttons.
5. Business value: reduces manual research, improves lead prioritization, and feeds SaaSQuatch's existing email/LinkedIn workflows.

## Suggested Email Attachments/Links

- GitHub repository link.
- Video walkthrough link.
- Resume.
- Business understanding answers in the email body or attached PDF/document.
- Optional: local/API demo notes from the README.
