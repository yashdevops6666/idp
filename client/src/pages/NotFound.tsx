import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <section className="section wrap">
      <span className="eyebrow">404</span>
      <h2>Nothing on the path here.</h2>
      <p className="lede">
        <Link to="/">Back to the platform home</Link>.
      </p>
    </section>
  );
}
