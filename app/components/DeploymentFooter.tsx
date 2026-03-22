import { readFileSync } from 'fs'
import { join } from 'path'
import BrandLine from '@/app/components/shared/BrandLine'

export default function DeploymentFooter() {
  let deploymentTime = 'Latest version deployed'

  try {
    // Read the build timestamp file created at build time
    const timestampFile = join(process.cwd(), 'public', 'build-timestamp.txt')
    deploymentTime = readFileSync(timestampFile, 'utf-8')
  } catch (error) {
    // Fallback if file doesn't exist
    deploymentTime = 'Latest version deployed'
  }

  return (
    <footer className="border-t bg-gray-50 py-4 text-center text-sm text-gray-600 mt-12">
      <BrandLine className="mb-1 text-gray-400" />
      <p>Version Deployed: {deploymentTime}</p>
    </footer>
  )
}

