import { useLocation } from 'react-router-dom';
import { Icon } from './Icon'

export function Footer() {
  const location = useLocation();
  const isShop = location.pathname === '/shop';
  const isAbout = location.pathname === '/about';
  const creditMark = isShop || isAbout;
  return (
    <footer className="site-footer">
      <div className="footer-left">
        <p className="copyright">© {new Date().getFullYear()} Elaina Fielding</p>
      </div>
      <div className="footer-center">
        {creditMark &&
        <p className="agd-mark">site built by <a href="https://analoguegonedigital.co.uk" target="_blank" rel="noopener noreferrer">analoguegonedigital.co.uk</a></p>
        }          
        </div>
      <div className="footer-right">
        <a className="insta-icon" href="https://www.instagram.com/elainafielding/" target="_blank" rel="noopener noreferrer"><Icon name="instagram" /></a>
      </div>
    </footer>
  )
}