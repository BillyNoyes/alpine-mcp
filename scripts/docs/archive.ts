import { createReadStream } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { extract } from 'tar';

export async function extractArchive(archivePath: string, destination: string): Promise<void> {
  await pipeline(createReadStream(archivePath), extract({ cwd: destination }));
  await rm(archivePath);
}

export async function replaceDirectory(stagedDirectory: string, targetDirectory: string): Promise<void> {
  const backupDirectory = `${targetDirectory}.backup`;
  await rm(backupDirectory, { recursive: true, force: true });

  let hasBackup = false;
  try {
    await rename(targetDirectory, backupDirectory);
    hasBackup = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  try {
    await rename(stagedDirectory, targetDirectory);
  } catch (error) {
    if (hasBackup) await rename(backupDirectory, targetDirectory);
    throw error;
  }

  await rm(backupDirectory, { recursive: true, force: true });
}
