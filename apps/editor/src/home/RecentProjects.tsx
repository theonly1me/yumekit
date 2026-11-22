import type { RecentProject } from "./homeApi.js";
import { recentFactsOf } from "./startTexts.js";

export function RecentProjects(props: {
  projects: RecentProject[];
  isBusy: boolean;
  failure: string | undefined;
  onOpen: (folder: string) => void;
}) {
  if (props.projects.length === 0) return undefined;
  const now = new Date();
  return (
    <div className="start-group recent-group">
      <h2>Recent projects</h2>
      <ul className="recent-list">
        {props.projects.map((project) => (
          <li key={project.folder}>
            <button
              type="button"
              className="recent"
              disabled={props.isBusy}
              onClick={() => {
                props.onOpen(project.folder);
              }}
            >
              <span>{project.name}</span>
              <em>{recentFactsOf({ project, now })}</em>
            </button>
          </li>
        ))}
      </ul>
      {props.failure === undefined ? undefined : (
        <p className="fact change-failure" role="alert">
          {props.failure}
        </p>
      )}
    </div>
  );
}
