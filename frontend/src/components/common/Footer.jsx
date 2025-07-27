import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👨‍🍳</span>
              <span className="text-xl font-bold">FoodieLocal</span>
            </div>
            <p className="text-gray-300 text-sm">
              Connecting food lovers with talented home chefs in their neighborhood. 
              Fresh, authentic, and delicious meals delivered to your door.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 text-xl transition-colors duration-200 hover\\:text-primary-600">
                📘
              </a>
              <a href="#" className="text-gray-400 text-xl transition-colors duration-200 hover\\:text-primary-600">
                🐦
              </a>
              <a href="#" className="text-gray-400 text-xl transition-colors duration-200 hover\\:text-primary-600">
                📷
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-8">
            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/meals" className="text-gray-300 text-sm transition-colors duration-200 hover\\:text-primary-600">
                    Browse Meals
                  </Link>
                </li>
                <li>
                  <Link to="/chef-register" className="text-gray-300 text-sm transition-colors duration-200 hover\\:text-primary-600">
                    Become a Chef
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-300 text-sm transition-colors duration-200 hover\\:text-primary-600">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-gray-300 text-sm transition-colors duration-200 hover\\:text-primary-600">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/help" className="text-gray-300 text-sm transition-colors duration-200 hover\\:text-primary-600">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-300 text-sm transition-colors duration-200 hover\\:text-primary-600">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-gray-300 text-sm transition-colors duration-200 hover\\:text-primary-600">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/safety" className="text-gray-300 text-sm transition-colors duration-200 hover\\:text-primary-600">
                    Food Safety
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-lg">📧</span>
                <span className="text-gray-300 text-sm">support@foodielocal.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg">📞</span>
                <span className="text-gray-300 text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg">📍</span>
                <span className="text-gray-300 text-sm">Available in major cities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col space-y-4 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 FoodieLocal. All rights reserved.
            </p>
            <div className="flex justify-center space-x-6">
              <Link to="/privacy" className="text-gray-400 text-sm transition-colors duration-200 hover\\:text-primary-600">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 text-sm transition-colors duration-200 hover\\:text-primary-600">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-400 text-sm transition-colors duration-200 hover\\:text-primary-600">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer