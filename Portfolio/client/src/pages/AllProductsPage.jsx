import { api } from '../api/client.js';
import { useAsync } from '../hooks/useAsync.js';
import { ProjectCard } from '../components/ProjectCard.jsx';
import { Loader } from '../components/Loader.jsx';

export function AllProductsPage() {
  const { data, loading } = useAsync(() => api.getProjects(), []);
  // Cap the archive at the six most recent entries.
  const projects = data?.slice(0, 6);

  return (
    <div className="container">
      <header className="page-head">
        <span className="page-head__eyebrow mono">Archive</span>
        <h1 className="page-head__title">All products</h1>
        <p className="page-head__lede">
          Everything, most recent first. Each entry links to the full case.
        </p>
      </header>

      {loading ? (
        <Loader label="Loading archive" />
      ) : (
        <div className="grid grid--rows">
          {projects?.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} variant="row" />
          ))}
        </div>
      )}
    </div>
  );
}
