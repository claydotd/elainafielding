import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";

export function Shop() {
  return (
    <>
      <Seo
        title="Shop"
        path="/shop"
        description="Shop for Elaina Fielding's work."
      />
      <div className="page-container page-container--shop">
        <article className="page">
          <div className="shop-content">
            <p>Coming soon.</p>
            <p>In the meantime, please <Link to="/about#contact">contact me</Link> if you would like to purchase a piece.</p>
          </div>
        </article>
      </div>
    </>
  )
}