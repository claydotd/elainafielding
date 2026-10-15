export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-left">
        <p>© {new Date().getFullYear()} Elaina Fielding</p>
      </div>
      <div className="footer-center">
        <a className="insta-icon"href="https://www.instagram.com/elainafielding/" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-instagram"></i></a>
      </div>
      <div className="footer-right">
        <p className="agd-mark">site built by <a href="https://analoguegonedigital.co.uk" target="_blank" rel="noopener noreferrer">analoguegonedigital.co.uk</a></p>
      </div>
    </footer>
  )
}