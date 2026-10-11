export const INSTALL_ORIGIN = "https://feedback-hub-smoky.vercel.app";

export function hostServerInstall(appName: string, secret: string) {
  return [
    `# ${appName}`,
    `curl -s -X POST ${INSTALL_ORIGIN}/api/embed/session \\`,
    `  -H "Authorization: Bearer ${secret}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"userId":"user-id","email":"user@example.com","name":"User name","plan":"Plus"}'`,
  ].join("\n");
}

export function viewInstall(appName: string) {
  return [
    `<!-- ${appName} -->`,
    `<button type="button" data-fh-open aria-label="Feedback">`,
    `  <!-- your icon -->`,
    `</button>`,
    `<script src="${INSTALL_ORIGIN}/embed.js" data-session="SESSION"></script>`,
  ].join("\n");
}
