import type { EmployeeDocStatus, EmployeeDocVersion } from "./types";

export function buildLatestByType(versions: EmployeeDocVersion[]) {
  const latestByType = new Map<string, string>();
  versions.forEach((version) => {
    if (!latestByType.has(version.docType)) {
      latestByType.set(version.docType, version.createdAt);
    }
  });
  return latestByType;
}

export function buildNeedsUpdateByType(statuses: EmployeeDocStatus[]) {
  const statusByType = new Map<
    string,
    { needsUpdate: boolean; updateNote: string | null }
  >();
  statuses.forEach((status) => {
    statusByType.set(status.docType, {
      needsUpdate: status.needsUpdate,
      updateNote: status.updateNote,
    });
  });
  return statusByType;
}

export function getUploadStatus({
  latest,
  needsUpdate,
}: {
  latest?: string;
  needsUpdate?: boolean;
}) {
  if (!latest) {
    return "Belum diunggah" as const;
  }
  if (needsUpdate) {
    return "Perlu pembaruan" as const;
  }
  return "Sudah diunggah" as const;
}
