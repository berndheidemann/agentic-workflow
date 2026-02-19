/** Information about a single prerequisite lesson. */
export interface PrerequisiteInfo {
  /** The lesson path as specified in frontmatter (e.g. "netzwerktechnik/ip-adressierung") */
  lessonPath: string;
  /** Human-readable display name (e.g. "IP-Adressierung") */
  displayName: string;
  /** Full href to the prerequisite page (e.g. "/ap1/netzwerktechnik/ip-adressierung/") */
  href: string;
}

/** Return type of usePrerequisites() */
export interface UsePrerequisitesReturn {
  /** Prerequisites that the user has NOT yet completed */
  unmet: PrerequisiteInfo[];
  /** Whether progress data is still loading */
  isLoading: boolean;
  /** Whether the user is a guest (not logged in) — banner must not be shown for guests */
  isGuest: boolean;
}
