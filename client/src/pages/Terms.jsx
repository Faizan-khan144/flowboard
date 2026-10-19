import LegalDoc from '../components/LegalDoc'

export default function Terms() {
  return (
    <LegalDoc
      title="Terms of Service"
      intro="These terms cover your use of Flowboard — the workspace, the API and everything the board does with your data."
      updated="October 2026"
      sections={[
        ['Using Flowboard', 'You can use Flowboard for personal projects and for work. You are responsible for the content you put in it and for keeping your login credentials safe.', 'You must be old enough to enter a contract where you live, and you may not use the service to break any law or to attack other users.'],
        ['Your content', 'Everything you create — issues, comments, projects, labels — belongs to you. We claim no ownership and we do not mine it for advertising.', 'You grant us the minimal licence needed to store, back up and display that content back to you and the teammates you invite.'],
        ['Plans and billing', 'The free plan stays free. Paid plans are billed per user, either monthly or yearly, and can be cancelled at any time from the workspace settings.', 'If a payment fails we keep your data intact and simply pause paid features until billing is resolved.'],
        ['Availability', 'We aim for the workspace to be reachable whenever you need it, but the software is provided as is, without warranty, and we are not liable for indirect losses.', 'If you self-host Flowboard, you are responsible for your own backups and availability.'],
        ['Ending the agreement', 'You can delete your workspace whenever you like. We will honour that request and remove the associated data.', 'We may suspend an account that abuses the service, and in that case we will tell you why.'],
      ]}
    />
  )
}
