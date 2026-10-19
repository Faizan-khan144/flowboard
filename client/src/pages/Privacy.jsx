import LegalDoc from '../components/LegalDoc'

export default function Privacy() {
  return (
    <LegalDoc
      title="Privacy Policy"
      intro="Short version: we collect what is needed to run your workspace, and nothing that exists to feed an ad network."
      updated="October 2026"
      sections={[
        ['What we store', 'Your name, email, a hashed password and the content you create: teams, projects, issues, labels, comments and notifications.', 'We also keep basic technical logs (timestamps, error traces) so we can debug the service.'],
        ['What we do not do', 'No advertising pixels, no selling or sharing of personal data, no reading of issue content for marketing.', 'We do not use third-party analytics that follow you across the web.'],
        ['Cookies and sessions', 'Authentication uses a token stored by your browser so you stay logged in. It exists to keep you signed in, not to track you.', 'Clearing it logs you out, and the demo workspace keeps working without an account.'],
        ['Your controls', 'You can export your issues at any time, edit your profile details, and delete your workspace — which removes the data behind it.', 'Team owners control who can access a workspace and what role they hold.'],
        ['Getting in touch', 'If you have a question about your data, write to privacy@flowboard.dev and a human will answer.', 'We will tell you within a reasonable time if a request requires anything else from you.'],
      ]}
    />
  )
}
