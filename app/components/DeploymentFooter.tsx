import { execSync } from 'child_process'

export default function DeploymentFooter() {
  let deploymentTime = 'Unknown'

  try {
    // Get the latest commit timestamp in ISO format
    const timestamp = execSync('git log -1 --format=%cI', {
      encoding: 'utf-8',
    })
      .toString()
      .trim()

    // Format it nicely for display
    const date = new Date(timestamp)
    deploymentTime = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    })
  } catch (error) {
    // Fallback if git command fails (e.g., in serverless environment)
    deploymentTime = 'Latest version deployed'
  }

  return (
    <footer className="border-t bg-gray-50 py-4 text-center text-sm text-gray-600 mt-12">
      <p>Version Deployed: {deploymentTime}</p>
    </footer>
  )
}

